package controller

import (
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidatePricingCategories(t *testing.T) {
	tests := []struct {
		name     string
		value    string
		valid    bool
		conflict string
	}{
		{name: "empty value clears the categories", value: "", valid: true},
		{name: "empty list", value: `[]`, valid: true},
		{name: "categories with distinct models", value: `[{"id":"sd20","name":"Seedance 2.0","description":"多条线路","models":["sd-2.0-线路1","seedance-2.0"]},{"id":"sd25","name":"Seedance 2.5","models":["seedance-2.5"]}]`, valid: true},
		{name: "category without models", value: `[{"id":"sd20","name":"Seedance 2.0","models":[]}]`, valid: true},
		{name: "model in two categories", value: `[{"id":"a","name":"A","models":["seedance-2.0"]},{"id":"b","name":"B","models":["seedance-2.0"]}]`, conflict: "seedance-2.0"},
		{name: "model listed twice in one category", value: `[{"id":"a","name":"A","models":["seedance-2.0","seedance-2.0"]}]`, conflict: "seedance-2.0"},
		{name: "duplicate ids", value: `[{"id":"a","name":"A","models":[]},{"id":"a","name":"B","models":[]}]`},
		{name: "blank name", value: `[{"id":"a","name":"  ","models":[]}]`},
		{name: "missing id", value: `[{"name":"A","models":[]}]`},
		{name: "padded model name", value: `[{"id":"a","name":"A","models":[" seedance-2.0"]}]`},
		{name: "name over 40 characters", value: `[{"id":"a","name":"` + strings.Repeat("类", 41) + `","models":[]}]`},
		{name: "not a list", value: `{"id":"a"}`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validatePricingCategories(tt.value)
			if tt.valid {
				assert.NoError(t, err)
				return
			}
			require.Error(t, err)
			var conflict *pricingCategoryConflictError
			if tt.conflict != "" {
				require.ErrorAs(t, err, &conflict)
				assert.Equal(t, tt.conflict, conflict.Model)
				return
			}
			assert.NotErrorAs(t, err, &conflict)
		})
	}
}

func TestPublicPricingCategoriesKeepsOnlyVisibleModels(t *testing.T) {
	common.OptionMapRWMutex.Lock()
	previous := common.OptionMap
	common.OptionMap = map[string]string{
		pricingCategoriesOptionKey: `[{"id":"sd20","name":"Seedance 2.0","models":["seedance-2.0","hidden-model","sd-2.0-线路1"]},{"id":"empty","name":"Empty","models":["hidden-model"]}]`,
	}
	common.OptionMapRWMutex.Unlock()
	t.Cleanup(func() {
		common.OptionMapRWMutex.Lock()
		common.OptionMap = previous
		common.OptionMapRWMutex.Unlock()
	})

	categories := publicPricingCategories([]model.Pricing{{ModelName: "sd-2.0-线路1"}, {ModelName: "seedance-2.0"}})

	require.Len(t, categories, 2)
	assert.Equal(t, []string{"seedance-2.0", "sd-2.0-线路1"}, categories[0].Models)
	assert.Empty(t, categories[1].Models)
}
