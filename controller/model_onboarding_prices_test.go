package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseUpstreamPricingKeepsOnlyPriceFields(t *testing.T) {
	body := []byte(`{"success":true,"group_ratio":{"vip":1.2},"data":[
		{"model_name":"video-a","quota_type":1,"model_price":0.5,"description":"ignored","enable_groups":["vip"],
		 "billing_plugin_variants":[{"plugin_key":"px","plugin_name":"PX","billing_mode":"tiered_expr","billing_expr":"seconds * 1","billing_usage_schema":{}}]},
		{"model_name":"  ","model_ratio":1}
	]}`)

	models, group, err := parseUpstreamPricing(body)

	require.NoError(t, err)
	assert.Equal(t, map[string]any{"vip": 1.2}, group)
	assert.Equal(t, map[string]map[string]any{"video-a": {
		"quota_type":  float64(1),
		"model_price": 0.5,
		"billing_plugin_variants": map[string]any{
			"px": map[string]any{"billing_mode": "tiered_expr", "billing_expr": "seconds * 1"},
		},
	}}, models)
}

func TestParseUpstreamPricingRejectsFailedResponse(t *testing.T) {
	_, _, err := parseUpstreamPricing([]byte(`{"success":false,"message":"denied"}`))

	assert.ErrorContains(t, err, "denied")
}

func TestDiffUpstreamPrices(t *testing.T) {
	baseline := map[string]map[string]any{
		"same":     {"model_ratio": 1.0},
		"repriced": {"model_ratio": 1.0, "completion_ratio": 4.0},
		"dropped":  {"model_price": 0.2},
	}
	latest := map[string]map[string]any{
		"same":     {"model_ratio": 1.0},
		"repriced": {"model_ratio": 1.5, "completion_ratio": 4.0},
		"new":      {"model_price": 0.3},
	}

	changes := diffUpstreamPrices(baseline, latest)

	require.Len(t, changes, 3)
	assert.Equal(t, "dropped", changes[0].ModelName)
	assert.Equal(t, "removed", changes[0].Kind)
	assert.Equal(t, "new", changes[1].ModelName)
	assert.Equal(t, "added", changes[1].Kind)
	assert.Equal(t, upstreamPriceChange{
		ModelName: "repriced",
		Kind:      "changed",
		Fields:    []upstreamPriceField{{Field: "model_ratio", Previous: 1.0, Current: 1.5}},
	}, changes[2])
}

func TestSnapshotChangesReportsGroupRatioChange(t *testing.T) {
	snapshot := upstreamPriceSnapshot{
		BaselineTime:  1,
		Baseline:      map[string]map[string]any{"m": {"model_ratio": 1.0}},
		BaselineGroup: map[string]any{"vip": 1.2},
		LatestTime:    2,
		Latest:        map[string]map[string]any{"m": {"model_ratio": 1.0}},
		LatestGroup:   map[string]any{"vip": 1.0},
	}

	changes := snapshotChanges(upstreamPriceChannel{ID: 3, Name: "PX"}, snapshot)

	require.Len(t, changes, 1)
	assert.Equal(t, "group_ratio", changes[0].Kind)
	assert.Equal(t, 3, changes[0].ChannelID)
	assert.Equal(t, []upstreamPriceField{{Field: "vip", Previous: 1.2, Current: 1.0}}, changes[0].Fields)
}

func TestUpstreamModelPricing(t *testing.T) {
	expr := "tier(\"base\", p * 2 + c * 8)"
	tests := []struct {
		name    string
		fields  map[string]any
		want    model.PricingValues
		wantErr string
	}{
		{
			name:   "model expression",
			fields: map[string]any{"quota_type": float64(0), "model_ratio": float64(1), "billing_mode": "tiered_expr", "billing_expr": expr},
			want:   model.PricingValues{"billing_setting.billing_mode": "tiered_expr", "billing_setting.billing_expr": expr},
		},
		{
			name: "single plugin expression",
			fields: map[string]any{"quota_type": float64(1), "model_price": 0.5, "billing_plugin_variants": map[string]any{
				"px": map[string]any{"billing_mode": "tiered_expr", "billing_expr": expr},
			}},
			want: model.PricingValues{"billing_setting.billing_mode": "tiered_expr", "billing_setting.billing_expr": expr},
		},
		{
			name: "plugins disagree",
			fields: map[string]any{"billing_plugin_variants": map[string]any{
				"a": map[string]any{"billing_mode": "tiered_expr", "billing_expr": expr},
				"b": map[string]any{"billing_mode": "tiered_expr", "billing_expr": "tier(\"base\", p)"},
			}},
			wantErr: upstreamPriceVariantsDiffer,
		},
		{
			name:   "fixed price",
			fields: map[string]any{"quota_type": float64(1), "model_price": 0.25},
			want:   model.PricingValues{"ModelPrice": 0.25},
		},
		{
			name:   "ratios",
			fields: map[string]any{"quota_type": float64(0), "model_ratio": 1.5, "completion_ratio": float64(4), "cache_ratio": 0.1},
			want:   model.PricingValues{"ModelRatio": 1.5, "CompletionRatio": float64(4), "CacheRatio": 0.1},
		},
		{
			name:    "no price",
			fields:  map[string]any{"quota_type": float64(1)},
			wantErr: upstreamPriceUnusable,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := upstreamModelPricing(test.fields)
			if test.wantErr != "" {
				require.EqualError(t, err, test.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.want, got)
		})
	}
}

func TestUpstreamPriceCheckPricesNewModelsAndApplyOverwrites(t *testing.T) {
	modelManagementDB(t, "sqlite", "")
	service.InitHttpClient()
	expr := "tier(\"base\", p * 2 + c * 8)"
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer supplier-token", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{"success":true,"group_ratio":{"default":1},"data":[
			{"model_name":"new-model","quota_type":0,"model_ratio":1,"billing_mode":"tiered_expr","billing_expr":"tier(\"base\", p * 2 + c * 8)"},
			{"model_name":"priced-model","quota_type":1,"model_price":0.3},
			{"model_name":"unserved-model","quota_type":1,"model_price":0.9}
		]}`))
	}))
	t.Cleanup(upstream.Close)
	baseURL := upstream.URL
	require.NoError(t, model.DB.Create(&model.Channel{
		Id: 1, Type: 1, Key: "key-1", Status: common.ChannelStatusEnabled, Name: "supplier",
		Group: "default", Models: "new-model,priced-model", BaseURL: &baseURL,
	}).Error)
	require.NoError(t, writeOnboardingOption(onboardingPricingTokenOption, map[string]string{"1": "  "}))
	assert.False(t, upstreamPriceCheckHandler{}.Enabled(), "the scheduled check waits for a supplier token")
	require.NoError(t, writeOnboardingOption(onboardingPricingTokenOption, map[string]string{"1": "supplier-token"}))
	assert.True(t, upstreamPriceCheckHandler{}.Enabled())
	require.NoError(t, model.UpdateModelPricing([]model.ModelPricingChange{{
		ModelName: "priced-model", ExpectedVersion: model.ModelPricingVersion(model.PricingValues{}),
		Pricing: model.PricingValues{"ModelPrice": 0.2},
	}}))
	call := func(handler gin.HandlerFunc, body string) map[string]any {
		t.Helper()
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
		handler(context)
		var response struct {
			Success bool           `json:"success"`
			Message string         `json:"message"`
			Data    map[string]any `json:"data"`
		}
		require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
		require.True(t, response.Success, response.Message)
		return response.Data["models"].(map[string]any)
	}
	pricing := func(name string) model.PricingValues {
		t.Helper()
		snapshot, err := model.GetModelPricingSnapshot([]string{name})
		require.NoError(t, err)
		return snapshot.Entries[0].Configured
	}

	models := call(CheckOnboardingUpstreamPrices, "")

	assert.Equal(t, model.PricingValues{"billing_setting.billing_mode": "tiered_expr", "billing_setting.billing_expr": expr}, pricing("new-model"))
	assert.Equal(t, model.PricingValues{"ModelPrice": 0.2}, pricing("priced-model"))
	assert.NotContains(t, models, "unserved-model")
	assert.Equal(t, true, models["new-model"].(map[string]any)["in_sync"])
	assert.Equal(t, false, models["priced-model"].(map[string]any)["in_sync"])

	models = call(ApplyOnboardingUpstreamPrice, `{"model_name":"priced-model"}`)

	assert.Equal(t, model.PricingValues{"ModelPrice": 0.3}, pricing("priced-model"))
	assert.Equal(t, true, models["priced-model"].(map[string]any)["in_sync"])
}
