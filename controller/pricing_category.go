package controller

import (
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const (
	pricingCategoriesOptionKey      = "PricingCategories"
	pricingCategoriesMax            = 50
	pricingCategoryModelsMax        = 200
	pricingCategoryNameMaxRunes     = 40
	pricingCategoryDescMaxRunes     = 300
	pricingCategoryIDMaxLength      = 64
	pricingCategoryModelNameMaxSize = 255
)

// pricingCategory groups models on the public pricing page. The option stores
// them in display order, each model listed in the order it is shown.
type pricingCategory struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Models      []string `json:"models"`
}

var errInvalidPricingCategories = errors.New("invalid pricing categories")

// pricingCategoryConflictError names a model listed by two categories.
type pricingCategoryConflictError struct {
	Model string
}

func (e *pricingCategoryConflictError) Error() string {
	return "model " + e.Model + " belongs to more than one pricing category"
}

// validatePricingCategories checks the PricingCategories option before it is
// saved: bounded text and counts, unique ids, and every model in at most one
// category.
func validatePricingCategories(value string) error {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	var categories []pricingCategory
	if err := common.UnmarshalJsonStr(value, &categories); err != nil {
		return errInvalidPricingCategories
	}
	if len(categories) > pricingCategoriesMax {
		return errInvalidPricingCategories
	}
	ids := make(map[string]struct{}, len(categories))
	owners := make(map[string]struct{})
	for _, category := range categories {
		id := strings.TrimSpace(category.ID)
		name := strings.TrimSpace(category.Name)
		if id == "" || len(id) > pricingCategoryIDMaxLength || id != category.ID {
			return errInvalidPricingCategories
		}
		if name == "" || utf8.RuneCountInString(name) > pricingCategoryNameMaxRunes {
			return errInvalidPricingCategories
		}
		if utf8.RuneCountInString(category.Description) > pricingCategoryDescMaxRunes {
			return errInvalidPricingCategories
		}
		if _, seen := ids[id]; seen {
			return errInvalidPricingCategories
		}
		ids[id] = struct{}{}
		if len(category.Models) > pricingCategoryModelsMax {
			return errInvalidPricingCategories
		}
		for _, modelName := range category.Models {
			if strings.TrimSpace(modelName) == "" || modelName != strings.TrimSpace(modelName) || len(modelName) > pricingCategoryModelNameMaxSize {
				return errInvalidPricingCategories
			}
			if _, taken := owners[modelName]; taken {
				return &pricingCategoryConflictError{Model: modelName}
			}
			owners[modelName] = struct{}{}
		}
	}
	return nil
}

// publicPricingCategories returns the saved categories limited to the models
// the caller can see, so a category never reveals a model outside the
// caller's groups. Categories left without visible models are still returned;
// the page hides empty sections.
func publicPricingCategories(pricing []model.Pricing) []pricingCategory {
	common.OptionMapRWMutex.RLock()
	value := common.OptionMap[pricingCategoriesOptionKey]
	common.OptionMapRWMutex.RUnlock()
	result := []pricingCategory{}
	if strings.TrimSpace(value) == "" {
		return result
	}
	var categories []pricingCategory
	if err := common.UnmarshalJsonStr(value, &categories); err != nil {
		common.SysError(common.LogText("invalid %s option: %v", pricingCategoriesOptionKey, err))
		return result
	}
	visible := make(map[string]struct{}, len(pricing))
	for _, item := range pricing {
		visible[item.ModelName] = struct{}{}
	}
	for _, category := range categories {
		models := make([]string, 0, len(category.Models))
		for _, modelName := range category.Models {
			if _, ok := visible[modelName]; ok {
				models = append(models, modelName)
			}
		}
		category.Models = models
		result = append(result, category)
	}
	return result
}
