group "default" {
  targets = ["koishi-steam-family-bot"]
}

target "docker-metadata-action" {}

target "koishi-steam-family-bot" {
  inherits = ["docker-metadata-action"]
  context = "./.github"
  dockerfile = "docker/Dockerfile"
  platforms = [
    "linux/amd64",
    "linux/arm64",
  ]
}

target "koishi-steam-family-bot-lite" {
  inherits = ["docker-metadata-action"]
  context = "./.github"
  dockerfile = "docker/lite.Dockerfile"
  platforms = [
    "linux/amd64",
    "linux/arm64",
  ]
}
