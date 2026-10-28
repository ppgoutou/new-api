package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetOnboardingOverview(t *testing.T) {
	require.NoError(t, DB.AutoMigrate(&Model{}))
	require.NoError(t, DB.Exec("DELETE FROM channels").Error)
	require.NoError(t, DB.Exec("DELETE FROM models").Error)
	t.Cleanup(func() {
		DB.Exec("DELETE FROM channels")
		DB.Exec("DELETE FROM models")
	})

	channels := []Channel{
		{Id: 1, Name: "alpha", Key: "k1", Group: "default,vip", Status: common.ChannelStatusEnabled, Models: "gpt-a,claude-x",
			OtherSettings: `{"upstream_model_update_last_detected_models":["gpt-new","gpt-a"],"upstream_model_update_last_removed_models":["claude-x","gone-already"]}`},
		{Id: 2, Name: "beta", Key: "k2", Group: "default", Status: common.ChannelStatusEnabled, Models: "gpt-a",
			OtherSettings: `{"upstream_model_update_last_detected_models":["gpt-new"]}`},
		{Id: 3, Name: "off", Key: "k3", Group: "default", Status: common.ChannelStatusManuallyDisabled, Models: "hidden-model",
			OtherSettings: `{"upstream_model_update_last_detected_models":["off-new"]}`},
		{Id: 4, Name: "broken", Key: "k4", Group: "default", Status: common.ChannelStatusEnabled, Models: "", OtherSettings: `not json`},
	}
	require.NoError(t, DB.Create(&channels).Error)
	require.NoError(t, DB.Create(&[]Model{
		{Id: 10, ModelName: "gpt-a", Tags: "chat, fast", NameRule: NameRuleExact},
		{Id: 11, ModelName: "claude", Tags: "chat,reasoning", NameRule: NameRulePrefix},
	}).Error)

	overview, err := GetOnboardingOverview()
	require.NoError(t, err)

	byName := make(map[string]OnboardingModel)
	for _, item := range overview.Items {
		byName[item.ModelName] = item
	}
	assert.Len(t, byName, 3, "disabled channels contribute nothing")

	newModel := byName["gpt-new"]
	assert.Empty(t, newModel.Channels)
	require.Len(t, newModel.PendingChannels, 2)
	assert.Equal(t, "default,vip", newModel.PendingChannels[0].Group)
	assert.Zero(t, newModel.MetadataID)

	configured := byName["gpt-a"]
	assert.Len(t, configured.Channels, 2)
	assert.Empty(t, configured.PendingChannels, "a pending name already on the channel is not pending")
	assert.Equal(t, 10, configured.MetadataID)

	assert.Empty(t, configured.RemovedChannels)

	ruled := byName["claude-x"]
	require.Len(t, ruled.RemovedChannels, 1, "a removed name still on the channel is listed")
	assert.Equal(t, 1, ruled.RemovedChannels[0].Id)
	_, listed := byName["gone-already"]
	assert.False(t, listed, "a removed name no longer on the channel is not listed")
	assert.Zero(t, ruled.MetadataID)
	assert.Equal(t, "claude", ruled.MetadataRule)

	assert.Equal(t, []string{"chat", "fast", "reasoning"}, overview.Tags)

	var broken Channel
	require.NoError(t, DB.First(&broken, 4).Error)
	assert.Equal(t, "not json", broken.OtherSettings, "reading never rewrites channel settings")
}
