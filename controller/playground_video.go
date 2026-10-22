package controller

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

// PlaygroundVideoPath is the native video endpoint a playground video request
// is served as.
const PlaygroundVideoPath = "/v1/videos"

// PreparePlaygroundVideo lets a signed-in user create a video task from the
// web console without an API key. Like the chat playground it charges the
// user's wallet through a temporary token with no token quota of its own, then
// rewrites the request to the native video endpoint so the task plugin
// pipeline that follows matches it exactly as an API call.
func PreparePlaygroundVideo(c *gin.Context) {
	if c.GetBool("use_access_token") {
		err := types.NewError(errors.New(i18n.T(c, i18n.MsgRelayAccessTokenUnsupported)), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		c.JSON(err.StatusCode, gin.H{"error": err.ToOpenAIError()})
		c.Abort()
		return
	}
	userId := c.GetInt("id")
	userCache, err := model.GetUserCache(userId)
	if err != nil {
		apiErr := types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
		c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.ToOpenAIError()})
		c.Abort()
		return
	}
	if userCache.Status != common.UserStatusEnabled {
		c.JSON(http.StatusForbidden, gin.H{"error": types.NewError(errors.New(i18n.T(c, i18n.MsgAuthUserBanned)), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry()).ToOpenAIError()})
		c.Abort()
		return
	}
	userCache.WriteContext(c)
	common.SetContextKey(c, constant.ContextKeyUsingGroup, userCache.Group)

	tempToken := &model.Token{
		UserId: userId,
		Name:   fmt.Sprintf("playground-%s", userCache.Group),
		Group:  userCache.Group,
	}
	if err := middleware.SetupContextForToken(c, tempToken); err != nil {
		c.Abort()
		return
	}
	common.SetContextKey(c, constant.ContextKeyPlayground, true)
	c.Request.URL.Path = PlaygroundVideoPath
	c.Next()
}
