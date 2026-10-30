package model

func GetModelEnableGroups(modelName string) []string {
	// 确保缓存最新
	GetPricing()

	if modelName == "" {
		return make([]string, 0)
	}

	modelEnableGroupsLock.RLock()
	groups, ok := modelEnableGroups[modelName]
	modelEnableGroupsLock.RUnlock()
	if !ok {
		return make([]string, 0)
	}
	return groups
}

// GetModelQuotaTypes 返回指定模型的计费类型集合（来自缓存）
func GetModelQuotaTypes(modelName string) []int {
	GetPricing()

	modelEnableGroupsLock.RLock()
	quota, ok := modelQuotaTypeMap[modelName]
	modelEnableGroupsLock.RUnlock()
	if !ok {
		return []int{}
	}
	return []int{quota}
}

// GetModelUnavailability reports whether a listed model refuses new requests,
// and the reason the administrator gave (来自缓存).
func GetModelUnavailability(modelName string) (reason string, unavailable bool) {
	GetPricing()

	modelEnableGroupsLock.RLock()
	reason, unavailable = modelUnavailable[modelName]
	modelEnableGroupsLock.RUnlock()
	return reason, unavailable
}
