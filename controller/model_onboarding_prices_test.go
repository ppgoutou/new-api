package controller

import (
	"testing"

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
