package controller

import (
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

// xClickIdCookie holds the X ad click ID (twclid) the web app saves when a
// visitor lands from an X ad.
const xClickIdCookie = "twclid"

// reportXSignUp keeps the visitor's X click ID on the new user, so later
// top-ups can be attributed too, and reports the sign-up to X.
func reportXSignUp(c *gin.Context, userId int, email string) {
	clickID, _ := c.Cookie(xClickIdCookie)
	clickID = strings.TrimSpace(clickID)
	if len(clickID) > 255 {
		clickID = ""
	}
	if clickID != "" {
		if setting, err := model.GetUserSetting(userId, true); err == nil {
			setting.XClickId = clickID
			_ = model.UpdateUserSetting(userId, setting)
		}
	}
	service.SendXConversion(service.XSignUpEvent, service.XConversion{
		ConversionID: "signup-" + strconv.Itoa(userId),
		ClickID:      clickID,
		Email:        email,
		IPAddress:    c.ClientIP(),
		UserAgent:    c.Request.UserAgent(),
	})
}
