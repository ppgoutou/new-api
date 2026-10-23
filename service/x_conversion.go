package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"

	"github.com/bytedance/gopkg/util/gopool"
)

// X (Twitter) Conversion API for pixel rhw6r. The access token and the event
// IDs come from X Ads Manager / Events Manager. They are set in the admin
// panel, with the X_PIXEL_* environment variables as a fallback; nothing is
// sent while the token or an event's ID is unset.
const xConversionURL = "https://ads-api.x.com/12/measurement/conversions/rhw6r"

// XSetting is an X value set in the admin panel, with an environment
// variable as the fallback.
type XSetting struct {
	adminValue *string
	env        string
}

var (
	xPixelToken    = XSetting{adminValue: &setting.XPixelToken, env: "X_PIXEL_TOKEN"}
	XSignUpEvent   = XSetting{adminValue: &setting.XPixelSignupEventId, env: "X_PIXEL_SIGNUP_EVENT_ID"}
	XPurchaseEvent = XSetting{adminValue: &setting.XPixelPurchaseEventId, env: "X_PIXEL_PURCHASE_EVENT_ID"}
)

// value is the admin setting, or the environment variable when it is empty.
func (s XSetting) value() string {
	if value := strings.TrimSpace(*s.adminValue); value != "" {
		return value
	}
	return strings.TrimSpace(os.Getenv(s.env))
}

// XConversion is one confirmed conversion. ConversionID deduplicates repeats
// on X's side; the other fields identify the user, at least one is needed.
type XConversion struct {
	ConversionID string
	ClickID      string
	Email        string
	IPAddress    string
	UserAgent    string
}

type xConversionIdentifier struct {
	Twclid      string `json:"twclid,omitempty"`
	HashedEmail string `json:"hashed_email,omitempty"`
	IPAddress   string `json:"ip_address,omitempty"`
	UserAgent   string `json:"user_agent,omitempty"`
}

type xConversionEvent struct {
	ConversionTime string                  `json:"conversion_time"`
	EventID        string                  `json:"event_id"`
	ConversionID   string                  `json:"conversion_id,omitempty"`
	Identifiers    []xConversionIdentifier `json:"identifiers"`
}

type xConversionRequest struct {
	Conversions []xConversionEvent `json:"conversions"`
}

// hashXEmail normalizes an email (trimmed, lowercase) and returns its SHA-256
// hex digest, or "" for an empty email.
func hashXEmail(email string) string {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(sum[:])
}

// buildXConversionRequest returns the request body for one event, or false
// when the conversion carries no usable identifier. The IP address and user
// agent only count as a pair.
func buildXConversionRequest(eventID string, conversion XConversion, now time.Time) (xConversionRequest, bool) {
	var identifiers []xConversionIdentifier
	if clickID := strings.TrimSpace(conversion.ClickID); clickID != "" {
		identifiers = append(identifiers, xConversionIdentifier{Twclid: clickID})
	}
	if hashed := hashXEmail(conversion.Email); hashed != "" {
		identifiers = append(identifiers, xConversionIdentifier{HashedEmail: hashed})
	}
	if conversion.IPAddress != "" && conversion.UserAgent != "" {
		identifiers = append(identifiers, xConversionIdentifier{IPAddress: conversion.IPAddress, UserAgent: conversion.UserAgent})
	}
	if len(identifiers) == 0 {
		return xConversionRequest{}, false
	}
	return xConversionRequest{Conversions: []xConversionEvent{{
		ConversionTime: now.UTC().Format("2006-01-02T15:04:05.000Z"),
		EventID:        eventID,
		ConversionID:   conversion.ConversionID,
		Identifiers:    identifiers,
	}}}, true
}

// SendXConversion reports a conversion for the event in the background.
// Failures are logged and never affect the caller.
func SendXConversion(event XSetting, conversion XConversion) {
	token := xPixelToken.value()
	eventID := event.value()
	if token == "" || eventID == "" {
		return
	}
	body, ok := buildXConversionRequest(eventID, conversion, time.Now())
	if !ok {
		return
	}
	gopool.Go(func() {
		if err := postXConversion(token, body); err != nil {
			common.SysError(common.LogText("x conversion %s (%s) failed: %s", eventID, conversion.ConversionID, err.Error()))
		}
	})
}

func postXConversion(token string, body xConversionRequest) error {
	payload, err := common.Marshal(body)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, xConversionURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("X-Pixel-Token", token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := GetHttpClient().Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		detail, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return fmt.Errorf("status %d: %s", resp.StatusCode, strings.TrimSpace(string(detail)))
	}
	return nil
}

// SendXTopUpConversion reports a paid top-up as a purchase. The user is
// identified by the X click ID saved at sign-up and their email.
func SendXTopUpConversion(userId int, tradeNo string) {
	if xPixelToken.value() == "" || XPurchaseEvent.value() == "" {
		return
	}
	user, err := model.GetUserById(userId, true)
	if err != nil {
		return
	}
	conversion := XConversion{
		ConversionID: "topup-" + tradeNo,
		ClickID:      user.GetSetting().XClickId,
		Email:        user.Email,
	}
	SendXConversion(XPurchaseEvent, conversion)
}
