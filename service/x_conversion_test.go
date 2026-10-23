package service

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// SHA-256 of "user@example.com".
const xTestHashedEmail = "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514"

func TestBuildXConversionRequest(t *testing.T) {
	now := time.Date(2026, 10, 24, 1, 2, 3, 4_000_000, time.FixedZone("UTC+8", 8*3600))
	cases := []struct {
		name        string
		conversion  XConversion
		identifiers []xConversionIdentifier
	}{
		{
			name:        "click id, normalized email and ip with user agent",
			conversion:  XConversion{ConversionID: "signup-7", ClickID: " click-1 ", Email: "  User@Example.COM ", IPAddress: "192.0.2.1", UserAgent: "Mozilla/5.0"},
			identifiers: []xConversionIdentifier{{Twclid: "click-1"}, {HashedEmail: xTestHashedEmail}, {IPAddress: "192.0.2.1", UserAgent: "Mozilla/5.0"}},
		},
		{
			name:        "ip without user agent is not an identifier",
			conversion:  XConversion{ConversionID: "topup-T1", Email: "user@example.com", IPAddress: "192.0.2.1"},
			identifiers: []xConversionIdentifier{{HashedEmail: xTestHashedEmail}},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body, ok := buildXConversionRequest("tw-rhw6r-abcde", tc.conversion, now)
			require.True(t, ok)
			require.Len(t, body.Conversions, 1)
			event := body.Conversions[0]
			assert.Equal(t, "2026-10-23T17:02:03.004Z", event.ConversionTime)
			assert.Equal(t, "tw-rhw6r-abcde", event.EventID)
			assert.Equal(t, tc.conversion.ConversionID, event.ConversionID)
			assert.Equal(t, tc.identifiers, event.Identifiers)
		})
	}
}

func TestBuildXConversionRequestSkipsConversionWithoutIdentifier(t *testing.T) {
	_, ok := buildXConversionRequest("tw-rhw6r-abcde", XConversion{ConversionID: "topup-T1", Email: "  ", UserAgent: "Mozilla/5.0"}, time.Now())
	assert.False(t, ok)
}
