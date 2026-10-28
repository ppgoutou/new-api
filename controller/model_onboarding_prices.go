package controller

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

// Option keys. The token key ends in "Token" so GET /api/option masks it.
const (
	onboardingPricingTokenOption    = "OnboardingUpstreamPricingToken"
	onboardingPriceSnapshotOption   = "OnboardingUpstreamPriceSnapshot"
	onboardingPriceFetchTimeout     = 20 * time.Second
	onboardingPriceMaxResponseBytes = 16 << 20
	onboardingGroupRatioModel       = ""
)

// upstreamPriceFields are the per-model fields of a new-api /api/pricing row
// that change what the supplier charges.
var upstreamPriceFields = []string{
	"quota_type", "model_ratio", "model_price", "completion_ratio",
	"cache_ratio", "create_cache_ratio", "image_ratio", "audio_ratio",
	"audio_completion_ratio", "billing_mode", "billing_expr", "billing_plugin_variants",
}

type upstreamPriceSnapshot struct {
	BaselineTime  int64                     `json:"baseline_time"`
	Baseline      map[string]map[string]any `json:"baseline"`
	BaselineGroup map[string]any            `json:"baseline_group_ratio"`
	LatestTime    int64                     `json:"latest_time"`
	Latest        map[string]map[string]any `json:"latest"`
	LatestGroup   map[string]any            `json:"latest_group_ratio"`
}

type upstreamPriceField struct {
	Field    string `json:"field"`
	Previous any    `json:"previous"`
	Current  any    `json:"current"`
}

// upstreamPriceChange is one difference between the acknowledged baseline and
// the latest fetch. An empty ModelName means the supplier's group ratios.
type upstreamPriceChange struct {
	ChannelID   int                  `json:"channel_id"`
	ChannelName string               `json:"channel_name"`
	ModelName   string               `json:"model_name"`
	Kind        string               `json:"kind"`
	Fields      []upstreamPriceField `json:"fields"`
}

type upstreamPriceChannel struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	BaseURL      string `json:"base_url"`
	HasToken     bool   `json:"has_token"`
	BaselineTime int64  `json:"baseline_time"`
	LatestTime   int64  `json:"latest_time"`
	Status       string `json:"status,omitempty"`
	Error        string `json:"error,omitempty"`
}

func readOnboardingOption[T any](key string) T {
	var value T
	common.OptionMapRWMutex.RLock()
	raw := common.OptionMap[key]
	common.OptionMapRWMutex.RUnlock()
	if strings.TrimSpace(raw) != "" {
		_ = common.UnmarshalJsonStr(raw, &value)
	}
	return value
}

func writeOnboardingOption(key string, value any) error {
	encoded, err := common.Marshal(value)
	if err != nil {
		return err
	}
	return model.UpdateOption(key, string(encoded))
}

// diffUpstreamPrices compares two model→fields maps and reports added,
// removed and changed models in name order.
func diffUpstreamPrices(baseline, latest map[string]map[string]any) []upstreamPriceChange {
	names := make([]string, 0, len(baseline)+len(latest))
	for name := range baseline {
		names = append(names, name)
	}
	for name := range latest {
		if _, ok := baseline[name]; !ok {
			names = append(names, name)
		}
	}
	slices.Sort(names)
	changes := make([]upstreamPriceChange, 0)
	for _, name := range names {
		before, hadBefore := baseline[name]
		after, hasAfter := latest[name]
		change := upstreamPriceChange{ModelName: name, Fields: []upstreamPriceField{}}
		switch {
		case !hadBefore:
			change.Kind = "added"
		case !hasAfter:
			change.Kind = "removed"
		default:
			change.Kind = "changed"
		}
		fields := upstreamPriceFields
		if name == onboardingGroupRatioModel {
			fields = sortedKeys(before, after)
		}
		for _, field := range fields {
			if reflect.DeepEqual(before[field], after[field]) {
				continue
			}
			change.Fields = append(change.Fields, upstreamPriceField{Field: field, Previous: before[field], Current: after[field]})
		}
		if change.Kind == "changed" && len(change.Fields) == 0 {
			continue
		}
		changes = append(changes, change)
	}
	return changes
}

func sortedKeys(maps ...map[string]any) []string {
	keys := make([]string, 0)
	for _, values := range maps {
		for key := range values {
			if !slices.Contains(keys, key) {
				keys = append(keys, key)
			}
		}
	}
	slices.Sort(keys)
	return keys
}

// parseUpstreamPricing keeps only the price fields of each row. Values go
// through JSON so stored snapshots and fresh fetches compare equal.
func parseUpstreamPricing(body []byte) (map[string]map[string]any, map[string]any, error) {
	var response struct {
		Success    bool             `json:"success"`
		Message    string           `json:"message"`
		Data       []map[string]any `json:"data"`
		GroupRatio map[string]any   `json:"group_ratio"`
	}
	if err := common.Unmarshal(body, &response); err != nil {
		return nil, nil, fmt.Errorf("invalid pricing response: %w", err)
	}
	if !response.Success {
		return nil, nil, fmt.Errorf("pricing request failed: %s", response.Message)
	}
	models := make(map[string]map[string]any, len(response.Data))
	for _, row := range response.Data {
		name, _ := row["model_name"].(string)
		if name = strings.TrimSpace(name); name == "" {
			continue
		}
		fields := make(map[string]any)
		for _, field := range upstreamPriceFields {
			value, ok := row[field]
			if !ok || value == nil || value == "" {
				continue
			}
			if field == "billing_plugin_variants" {
				value = pluginVariantPrices(value)
			}
			fields[field] = value
		}
		models[name] = fields
	}
	if response.GroupRatio == nil {
		response.GroupRatio = map[string]any{}
	}
	return models, response.GroupRatio, nil
}

// pluginVariantPrices reduces plugin variants to plugin key → expression, so
// schema or example edits upstream do not read as price changes.
func pluginVariantPrices(value any) any {
	variants, ok := value.([]any)
	if !ok {
		return value
	}
	prices := make(map[string]any, len(variants))
	for _, variant := range variants {
		entry, ok := variant.(map[string]any)
		if !ok {
			continue
		}
		key, _ := entry["plugin_key"].(string)
		prices[key] = map[string]any{"billing_mode": entry["billing_mode"], "billing_expr": entry["billing_expr"]}
	}
	return prices
}

func fetchUpstreamPricing(ctx context.Context, baseURL, token string) (map[string]map[string]any, map[string]any, error) {
	ctx, cancel := context.WithTimeout(ctx, onboardingPriceFetchTimeout)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(baseURL, "/")+"/api/pricing", nil)
	if err != nil {
		return nil, nil, err
	}
	request.Header.Set("Authorization", "Bearer "+token)
	response, err := service.GetHttpClient().Do(request)
	if err != nil {
		return nil, nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, nil, fmt.Errorf("pricing request returned HTTP %d", response.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, onboardingPriceMaxResponseBytes))
	if err != nil {
		return nil, nil, err
	}
	return parseUpstreamPricing(body)
}

func upstreamPriceChannels() ([]*model.Channel, error) {
	var channels []*model.Channel
	err := model.DB.Select("id", "name", "type", "base_url", "status").
		Where("status = ?", common.ChannelStatusEnabled).
		Order("id").
		Find(&channels).Error
	if err != nil {
		return nil, err
	}
	return slices.DeleteFunc(channels, func(channel *model.Channel) bool {
		return !strings.HasPrefix(channel.GetBaseURL(), "http")
	}), nil
}

func upstreamPriceChannelRows(channels []*model.Channel) []upstreamPriceChannel {
	tokens := readOnboardingOption[map[string]string](onboardingPricingTokenOption)
	snapshots := readOnboardingOption[map[string]upstreamPriceSnapshot](onboardingPriceSnapshotOption)
	rows := make([]upstreamPriceChannel, 0, len(channels))
	for _, channel := range channels {
		key := strconv.Itoa(channel.Id)
		snapshot := snapshots[key]
		rows = append(rows, upstreamPriceChannel{
			ID:           channel.Id,
			Name:         channel.Name,
			BaseURL:      channel.GetBaseURL(),
			HasToken:     strings.TrimSpace(tokens[key]) != "",
			BaselineTime: snapshot.BaselineTime,
			LatestTime:   snapshot.LatestTime,
		})
	}
	return rows
}

func snapshotChanges(channel upstreamPriceChannel, snapshot upstreamPriceSnapshot) []upstreamPriceChange {
	if snapshot.LatestTime == 0 {
		return nil
	}
	changes := diffUpstreamPrices(snapshot.Baseline, snapshot.Latest)
	group := diffUpstreamPrices(
		map[string]map[string]any{onboardingGroupRatioModel: snapshot.BaselineGroup},
		map[string]map[string]any{onboardingGroupRatioModel: snapshot.LatestGroup},
	)
	for _, change := range group {
		change.Kind = "group_ratio"
		changes = append(changes, change)
	}
	for i := range changes {
		changes[i].ChannelID = channel.ID
		changes[i].ChannelName = channel.Name
	}
	return changes
}

func upstreamPriceReport(rows []upstreamPriceChannel) gin.H {
	snapshots := readOnboardingOption[map[string]upstreamPriceSnapshot](onboardingPriceSnapshotOption)
	changes := make([]upstreamPriceChange, 0)
	for _, row := range rows {
		changes = append(changes, snapshotChanges(row, snapshots[strconv.Itoa(row.ID)])...)
	}
	return gin.H{"channels": rows, "changes": changes}
}

// GetOnboardingUpstreamPrices returns the last check's changes without fetching.
func GetOnboardingUpstreamPrices(c *gin.Context) {
	channels, err := upstreamPriceChannels()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, upstreamPriceReport(upstreamPriceChannelRows(channels)))
}

// SetOnboardingUpstreamPricingToken stores or clears the supplier dashboard
// token used to read one channel's upstream /api/pricing. It is never returned.
func SetOnboardingUpstreamPricingToken(c *gin.Context) {
	var request struct {
		ChannelID int    `json:"channel_id"`
		Token     string `json:"token"`
	}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil || request.ChannelID <= 0 {
		common.ApiErrorStatus(c, http.StatusBadRequest, common.NewMessage("Invalid request parameter format"))
		return
	}
	tokens := readOnboardingOption[map[string]string](onboardingPricingTokenOption)
	if tokens == nil {
		tokens = map[string]string{}
	}
	key := strconv.Itoa(request.ChannelID)
	if token := strings.TrimSpace(request.Token); token != "" {
		tokens[key] = token
	} else {
		delete(tokens, key)
	}
	if err := writeOnboardingOption(onboardingPricingTokenOption, tokens); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "model.onboarding.pricing_token", map[string]any{"channel_id": request.ChannelID, "set": strings.TrimSpace(request.Token) != ""})
	common.ApiSuccess(c, nil)
}

// CheckOnboardingUpstreamPrices fetches every tokened channel's upstream
// pricing, keeps it as the latest snapshot and reports what differs from the
// acknowledged baseline. A channel's first fetch becomes its baseline.
func CheckOnboardingUpstreamPrices(c *gin.Context) {
	channels, err := upstreamPriceChannels()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	rows := upstreamPriceChannelRows(channels)
	tokens := readOnboardingOption[map[string]string](onboardingPricingTokenOption)
	type fetched struct {
		models map[string]map[string]any
		group  map[string]any
		err    error
	}
	results := make([]fetched, len(rows))
	var wg sync.WaitGroup
	for i, row := range rows {
		token := strings.TrimSpace(tokens[strconv.Itoa(row.ID)])
		if token == "" {
			continue
		}
		wg.Go(func() {
			models, group, err := fetchUpstreamPricing(c.Request.Context(), row.BaseURL, token)
			results[i] = fetched{models: models, group: group, err: err}
		})
	}
	wg.Wait()

	snapshots := readOnboardingOption[map[string]upstreamPriceSnapshot](onboardingPriceSnapshotOption)
	if snapshots == nil {
		snapshots = map[string]upstreamPriceSnapshot{}
	}
	now := common.GetTimestamp()
	for i := range rows {
		if !rows[i].HasToken {
			continue
		}
		if results[i].err != nil {
			rows[i].Status = "error"
			rows[i].Error = results[i].err.Error()
			continue
		}
		key := strconv.Itoa(rows[i].ID)
		snapshot := snapshots[key]
		snapshot.Latest, snapshot.LatestGroup, snapshot.LatestTime = results[i].models, results[i].group, now
		if snapshot.BaselineTime == 0 {
			snapshot.Baseline, snapshot.BaselineGroup, snapshot.BaselineTime = results[i].models, results[i].group, now
			rows[i].Status = "baseline"
		} else {
			rows[i].Status = "ok"
		}
		rows[i].BaselineTime, rows[i].LatestTime = snapshot.BaselineTime, snapshot.LatestTime
		snapshots[key] = snapshot
	}
	if err := writeOnboardingOption(onboardingPriceSnapshotOption, snapshots); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, upstreamPriceReport(rows))
}

// AcknowledgeOnboardingUpstreamPrices moves the latest upstream values into
// the baseline for the given models (all models when none are given), so
// handled changes stop showing.
func AcknowledgeOnboardingUpstreamPrices(c *gin.Context) {
	var request struct {
		ChannelID  int      `json:"channel_id"`
		ModelNames []string `json:"model_names"`
		GroupRatio bool     `json:"group_ratio"`
	}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil || request.ChannelID <= 0 {
		common.ApiErrorStatus(c, http.StatusBadRequest, common.NewMessage("Invalid request parameter format"))
		return
	}
	snapshots := readOnboardingOption[map[string]upstreamPriceSnapshot](onboardingPriceSnapshotOption)
	key := strconv.Itoa(request.ChannelID)
	snapshot, ok := snapshots[key]
	if !ok || snapshot.LatestTime == 0 {
		common.ApiErrorStatus(c, http.StatusBadRequest, common.NewMessage("Invalid request parameter format"))
		return
	}
	if len(request.ModelNames) == 0 && !request.GroupRatio {
		snapshot.Baseline, snapshot.BaselineGroup = snapshot.Latest, snapshot.LatestGroup
	} else {
		if snapshot.Baseline == nil {
			snapshot.Baseline = map[string]map[string]any{}
		}
		for _, name := range request.ModelNames {
			if latest, exists := snapshot.Latest[name]; exists {
				snapshot.Baseline[name] = latest
			} else {
				delete(snapshot.Baseline, name)
			}
		}
		if request.GroupRatio {
			snapshot.BaselineGroup = snapshot.LatestGroup
		}
	}
	snapshots[key] = snapshot
	if err := writeOnboardingOption(onboardingPriceSnapshotOption, snapshots); err != nil {
		common.ApiError(c, err)
		return
	}
	channels, err := upstreamPriceChannels()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, upstreamPriceReport(upstreamPriceChannelRows(channels)))
}
