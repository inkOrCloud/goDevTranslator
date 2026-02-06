# 自动 Release 工作流

## 变更内容
添加 GitHub Actions 工作流，当 `package.json` 中的 `version` 字段变化时自动创建新的 Release。

## 工作流文件
- `.github/workflows/release-on-version-change.yml`

## 辅助文件
- `test-release-workflow.sh` - 本地测试脚本
- `RELEASE_WORKFLOW_GUIDE.md` - 完整指南

## 工作原理
1. 推送 commit 到 main 分支时，检查 package.json 是否变化
2. 比较当前版本与最新 release 标签（v*）
3. 如果版本不同，生成从上一个 release 到当前 commit 的 changelog
4. 使用 `softprops/action-gh-release` 创建新的 GitHub Release

## 测试
已在 fork 仓库测试通过：
- [ ] 修改 version 字段后工作流自动触发
- [ ] 正确检测版本变化
- [ ] 生成正确的 changelog
- [ ] 成功创建 release

## 注意事项
- Release 标签格式为 `v{version}`
- 需要 GitHub Actions 的 write 权限（默认 GITHUB_TOKEN 已足够）
- 首次运行时若没有现有 release 标签，会创建第一个 release