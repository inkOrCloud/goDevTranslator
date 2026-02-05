# 开发环境配置

## Git SSH 密钥配置

要将代码推送到远程仓库，您需要配置SSH密钥：

1. 生成SSH密钥对：
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. 将公钥添加到GitHub账户：
   - 复制公钥内容：`cat ~/.ssh/id_rsa.pub`
   - 登录GitHub，进入 Settings > SSH and GPG keys
   - 点击 New SSH key，粘贴公钥内容

3. 验证SSH连接：
   ```bash
   ssh -T git@github.com
   ```

## 依赖安装

项目使用npm管理依赖，安装命令：
```bash
npm install
```

## 构建项目

构建项目使用以下命令：
```bash
npm run build
```

## 版本发布

发布新版本时：
1. 更新package.json中的版本号
2. 提交更改并打上标签
3. 推送更改和标签到远程仓库