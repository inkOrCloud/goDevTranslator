# 自动 Release 工作流指南

此工作流会在每次向 main 分支推送 commit 时，检测 `package.json` 中的 `version` 字段是否发生变化。如果版本号变化，将自动创建一个新的 GitHub Release，其说明为从当前 commit 到上一个 release 对应 commit（不包括）的变化。

## 工作流文件
`.github/workflows/release-on-version-change.yml`

## 测试步骤（推荐）

### 1. Fork 仓库到你的 GitHub 账户
- 访问 https://github.com/inkOrCloud/goDevTranslator
- 点击右上角 "Fork" 按钮

### 2. 克隆你 fork 的仓库
```bash
git clone https://github.com/YOUR_USERNAME/goDevTranslator.git
cd goDevTranslator
```

### 3. 添加工作流文件
将 `.github/workflows/release-on-version-change.yml` 复制到你的仓库中，或使用以下命令从本仓库拉取：

```bash
git remote add upstream https://github.com/inkOrCloud/goDevTranslator.git
git fetch upstream
git checkout -b add-release-workflow upstream/add-release-workflow
```

### 4. 本地测试逻辑
运行测试脚本验证工作流逻辑：
```bash
./test-release-workflow.sh
```

脚本会模拟版本检查并显示将会生成的 changelog。

### 5. 修改版本号并推送以触发 Actions
编辑 `package.json`，将 `version` 字段从 `0.3.0` 改为 `0.3.1`（或任何其他新版本号）：

```bash
# 使用 jq 修改（需要安装 jq）
jq '.version = "0.3.1"' package.json > package.json.tmp && mv package.json.tmp package.json

# 或者手动编辑
```

提交并推送：
```bash
git add package.json
git commit -m "bump version to 0.3.1"
git push origin add-release-workflow
```

### 6. 观察 GitHub Actions 运行
- 访问你的 fork 仓库的 "Actions" 标签页
- 查看 "Release on Version Change" 工作流运行情况
- 如果版本号变化，工作流会创建一个新的 Release（需要仓库有 write 权限）

### 7. 测试成功后向原仓库提交 PR
在你的 fork 仓库页面，点击 "Pull requests" → "New pull request"
- 选择 base: `inkOrCloud/goDevTranslator.main` ← compare: `YOUR_USERNAME/goDevTranslator.add-release-workflow`
- 填写 PR 标题和描述
- 提交 PR

## 工作流触发条件
- 推送至 `main` 分支
- 且 `package.json` 文件有变化（GitHub 的 paths 过滤）

## 工作原理
1. **获取当前版本**：从 `package.json` 读取 `version` 字段
2. **获取上一个 release**：查找最新的 `v*` 标签（如 `v0.3.0`）
3. **版本比较**：如果当前版本与上一个 release 版本不同，则创建新 release
4. **生成 changelog**：使用 `git log` 生成从上一个 release 标签到当前 HEAD 的提交记录
5. **创建 release**：使用 `softprops/action-gh-release` 创建 GitHub Release

## 注意事项
- 确保仓库的 GitHub Actions 已启用
- 首次运行时可能需要配置 Actions 的 write 权限（Settings → Actions → General → Workflow permissions）
- Release 标签格式为 `v{version}`（如 `v0.3.1`）
- 如果 package.json 版本号回退，也会触发 release（请谨慎管理版本号）

## 故障排除
- **工作流未触发**：检查是否推送到 main 分支，且 package.json 确实有变化
- **权限错误**：确保 GitHub Token 有创建 release 的权限（GITHUB_TOKEN 默认有仓库 write 权限）
- **Changelog 为空**：检查 git 历史记录，确保有新的提交

## 自定义
如需修改工作流行为，可编辑 `.github/workflows/release-on-version-change.yml`：
- 更改触发分支
- 调整标签匹配模式（第 24 行的 `git tag --list 'v*'`）
- 修改 changelog 格式（第 61-75 行）