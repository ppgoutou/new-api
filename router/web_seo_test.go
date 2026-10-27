package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const seoTestIndex = `<html><head><!--seo:start--><title>X</title><!--seo:end--></head><body><div id="root"></div></body></html>`

func setupSEOTest(t *testing.T, homeContent string, refundPolicy string) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	prevName, prevAddr, prevFooter, prevMap := common.SystemName, system_setting.ServerAddress, common.Footer, common.OptionMap
	prevLegal := *system_setting.GetLegalSettings()
	t.Cleanup(func() {
		common.SystemName, system_setting.ServerAddress, common.Footer, common.OptionMap = prevName, prevAddr, prevFooter, prevMap
		*system_setting.GetLegalSettings() = prevLegal
	})

	common.SystemName = "Acme <Video>"
	system_setting.ServerAddress = "https://video.example.com/"
	common.Footer = "<!-- lang:en -->\n<span>support@example.com</span>\n<!-- lang:zh -->\n<span>客服</span>"
	common.OptionMap = map[string]string{"HomePageContent": homeContent}
	*system_setting.GetLegalSettings() = system_setting.LegalSettings{PrivacyPolicy: "p", RefundPolicy: refundPolicy}

	engine := gin.New()
	engine.GET("/robots.txt", serveRobotsTxt)
	engine.GET("/sitemap.xml", serveSitemapXML)
	engine.NoRoute(func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html", renderIndexPage(c, []byte(seoTestIndex), c.Request.URL.Path))
	})
	return engine
}

func getBody(t *testing.T, engine *gin.Engine, path string) string {
	t.Helper()
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	require.Equal(t, http.StatusOK, rec.Code)
	return rec.Body.String()
}

func TestRenderIndexPageServesSameMetadataAndHomeCopyToEveryone(t *testing.T) {
	engine := setupSEOTest(t, "", "r")

	home := getBody(t, engine, "/")
	assert.Contains(t, home, "<title>Acme &lt;Video&gt; | AI Video Generator powered by Seedance</title>")
	assert.Contains(t, home, `<link rel="canonical" href="https://video.example.com/" />`)
	assert.Contains(t, home, `<meta property="og:image" content="https://video.example.com/logo.png" />`)
	assert.Contains(t, home, `<div id="prerender"`)
	assert.Contains(t, home, "<span>support@example.com</span>")
	assert.NotContains(t, home, "客服")
	assert.Contains(t, home, `<a href="/refund-policy">Refund Policy</a>`)
	assert.Less(t, strings.Index(home, `id="prerender"`), strings.Index(home, `<div id="root"></div>`))

	pricing := getBody(t, engine, "/pricing")
	assert.Contains(t, pricing, "<title>Acme &lt;Video&gt; | Pricing</title>")
	assert.NotContains(t, pricing, `id="prerender"`)

	landing := getBody(t, engine, "/landing")
	assert.Contains(t, landing, "<title>Acme &lt;Video&gt; | Cinematic AI Video, Billed per Second</title>")
	assert.Contains(t, landing, `<link rel="canonical" href="https://video.example.com/landing" />`)
	assert.NotContains(t, landing, `id="prerender"`)

	assert.Equal(t, seoTestIndex, getBody(t, engine, "/dashboard"))
}

func TestRenderIndexPageSkipsHomeCopyWhenCustomHomeIsConfigured(t *testing.T) {
	engine := setupSEOTest(t, "# Custom", "")

	home := getBody(t, engine, "/")
	assert.Contains(t, home, "| AI Video Generator powered by Seedance</title>")
	assert.NotContains(t, home, `id="prerender"`)
}

func TestRobotsAndSitemapListOnlyConfiguredPublicPages(t *testing.T) {
	engine := setupSEOTest(t, "", "")

	robots := getBody(t, engine, "/robots.txt")
	assert.Contains(t, robots, "Disallow: /api/\n")
	assert.Contains(t, robots, "Sitemap: https://video.example.com/sitemap.xml\n")

	sitemap := getBody(t, engine, "/sitemap.xml")
	assert.Contains(t, sitemap, "<loc>https://video.example.com/</loc>")
	assert.Contains(t, sitemap, "<loc>https://video.example.com/landing</loc>")
	assert.Contains(t, sitemap, "<loc>https://video.example.com/privacy-policy</loc>")
	assert.NotContains(t, sitemap, "/refund-policy")
	assert.NotContains(t, sitemap, "/about")
}
