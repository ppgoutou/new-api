package router

import (
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-gonic/gin"
)

// SetHomeMediaRouter serves files uploaded for the public home page. It sits
// outside /api so video range requests skip the API rate limit and gzip.
func SetHomeMediaRouter(router *gin.Engine) {
	route := router.Group("/home-media")
	route.Use(middleware.RouteTag("web"))
	route.GET("/:name", controller.ServeHomeMedia)
	route.HEAD("/:name", controller.ServeHomeMedia)
}

// SetVideoAssetRouter serves reference files users upload on the video
// creation page. Upstream video services fetch them without credentials.
func SetVideoAssetRouter(router *gin.Engine) {
	route := router.Group("/video-assets")
	route.Use(middleware.RouteTag("web"))
	route.GET("/:name", controller.ServeVideoAsset)
	route.HEAD("/:name", controller.ServeVideoAsset)
}
