# Ubuntu 24.04 服务器环境初始化完整教程

> 适用系统：Ubuntu Server 24.04 LTS（Noble）  
> 推荐执行用户：拥有 `sudo` 权限的普通用户  
> 适用场景：Java、Python、Node.js、Docker、AI 编程 Agent 开发环境

---

## 目录

1. [初始化前说明](#一初始化前说明)
2. [系统更新与常用基础工具](#二系统更新与常用基础工具)
3. [配置国内 Ubuntu APT 镜像源](#三配置国内-ubuntu-apt-镜像源)
4. [配置 Git](#四配置-git)
5. [安装 NVM、Node.js 和 npm](#五安装-nvmnodejs-和-npm)
6. [配置 npm 国内镜像](#六配置-npm-国内镜像)
7. [安装 pnpm](#七安装-pnpm)
8. [安装 Python 基础环境](#八安装-python-基础环境)
9. [安装 pyenv 管理 Python 版本](#九安装-pyenv-管理-python-版本)
10. [安装 uv](#十安装-uv)
11. [配置 Python 国内镜像](#十一配置-python-国内镜像)
12. [安装 Java](#十二安装-java)
13. [安装 Docker 和 Docker Compose](#十三安装-docker-和-docker-compose)
14. [安装 AI 编程工具](#十四安装-ai-编程工具)
15. [推荐安装的服务器工具](#十五推荐安装的服务器工具)
16. [防火墙和基础安全配置](#十六防火墙和基础安全配置)
17. [创建项目目录](#十七创建项目目录)
18. [最终环境检查](#十八最终环境检查)
19. [常见问题](#十九常见问题)
20. [推荐安装顺序](#二十推荐安装顺序)

---

## 一、初始化前说明

不要长期使用 `root` 用户开发。推荐创建普通用户并加入 `sudo` 组，然后使用普通用户安装 NVM、Node.js、pyenv、uv 和各种 AI CLI。

确认当前用户：

```bash
whoami
```

确认系统版本：

```bash
cat /etc/os-release
uname -m
```

Ubuntu 24.04 的代号应为：

```text
noble
```

常见 CPU 架构：

```text
x86_64   # AMD64 / Intel 64 位

aarch64  # ARM64
```

---

## 二、系统更新与常用基础工具

更新系统软件包：

```bash
sudo apt update
sudo apt upgrade -y
```

安装常用基础工具：

```bash
sudo apt install -y \
  ca-certificates \
  curl \
  wget \
  git \
  unzip \
  zip \
  tar \
  gzip \
  xz-utils \
  gnupg \
  lsb-release \
  software-properties-common \
  build-essential \
  pkg-config \
  make \
  gcc \
  g++ \
  jq \
  tree \
  vim \
  nano \
  htop \
  tmux \
  net-tools \
  dnsutils \
  iproute2 \
  iputils-ping \
  traceroute \
  rsync \
  openssh-client \
  ufw
```

清理无用软件包：

```bash
sudo apt autoremove -y
sudo apt clean
```

---

## 三、配置国内 Ubuntu APT 镜像源

> 如果服务器位于中国大陆，配置国内镜像通常可以提升 `apt` 下载速度。海外服务器一般继续使用官方源即可。

Ubuntu 24.04 默认主要使用：

```text
/etc/apt/sources.list.d/ubuntu.sources
```

### 3.1 备份原始配置

```bash
sudo cp /etc/apt/sources.list.d/ubuntu.sources \
  /etc/apt/sources.list.d/ubuntu.sources.backup
```

### 3.2 使用清华大学镜像

```bash
sudo tee /etc/apt/sources.list.d/ubuntu.sources > /dev/null <<'EOF_APT'
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu/
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu/
Suites: noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
EOF_APT
```

更新索引：

```bash
sudo apt update
```

### 3.3 恢复官方源

如果镜像出现异常，可以恢复：

```bash
sudo cp /etc/apt/sources.list.d/ubuntu.sources.backup \
  /etc/apt/sources.list.d/ubuntu.sources
sudo apt update
```

也可以将镜像域名替换为其他可信镜像：

```text
阿里云：https://mirrors.aliyun.com/ubuntu/
腾讯云：https://mirrors.cloud.tencent.com/ubuntu/
中科大：https://mirrors.ustc.edu.cn/ubuntu/
```

不要同时配置大量重复源，否则容易出现重复索引和版本冲突。

---

## 四、配置 Git

Git 已在基础工具步骤中安装。

检查版本：

```bash
git --version
```

配置用户名和邮箱：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

推荐配置：

```bash
git config --global init.defaultBranch main
git config --global core.autocrlf input
git config --global pull.rebase false
git config --global color.ui auto
```

查看配置：

```bash
git config --global --list
```

### 4.1 生成 SSH 密钥

```bash
ssh-keygen -t ed25519 -C "你的邮箱"
```

一路按回车即可。查看公钥：

```bash
cat ~/.ssh/id_ed25519.pub
```

将输出内容添加到 GitHub、GitLab 或公司代码平台。

测试 GitHub：

```bash
ssh -T git@github.com
```

### 4.2 可选：Git 代理

假设本机代理监听 `127.0.0.1:7890`：

```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

取消代理：

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

## 五、安装 NVM、Node.js 和 npm

NVM 用于为当前用户安装和切换多个 Node.js 版本。不要用 `sudo` 安装 NVM。

### 5.1 安装 NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

重新加载 Shell：

```bash
source ~/.bashrc
```

验证：

```bash
command -v nvm
nvm --version
```

如果提示 `nvm: command not found`，执行：

```bash
cat >> ~/.bashrc <<'EOF_NVM'

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF_NVM

source ~/.bashrc
```

### 5.2 安装 Node.js

建议安装当前 LTS：

```bash
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'
```

由于 Claude Code 的 npm 包当前要求 Node.js 22 或更高版本，也可以明确安装 Node.js 22：

```bash
nvm install 22
nvm use 22
nvm alias default 22
```

验证：

```bash
node -v
npm -v
nvm current
```

### 5.3 常用 NVM 命令

```bash
nvm ls
nvm ls-remote --lts
nvm install 20
nvm install 22
nvm use 22
nvm alias default 22
nvm uninstall 20
```

不要执行：

```bash
sudo npm install -g 某个包
```

NVM 的全局 npm 包属于当前普通用户，不需要 `sudo`。

---

## 六、配置 npm 国内镜像

配置 npmmirror：

```bash
npm config set registry https://registry.npmmirror.com
```

检查：

```bash
npm config get registry
```

测试：

```bash
npm ping
```

恢复 npm 官方源：

```bash
npm config set registry https://registry.npmjs.org
```

查看所有 npm 配置：

```bash
npm config list
```

> 部分 AI CLI 安装包可能需要从 GitHub 或厂商 CDN 下载平台二进制文件。仅设置 npm 镜像不一定能解决所有网络问题。

---

## 七、安装 pnpm

推荐使用 Corepack。Node.js 通常自带 Corepack，但部分版本可能需要手动启用。

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

检查：

```bash
pnpm -v
```

如果 `corepack` 不可用，可以通过 npm 安装：

```bash
npm install -g pnpm
```

配置 pnpm 国内镜像：

```bash
pnpm config set registry https://registry.npmmirror.com
```

检查：

```bash
pnpm config get registry
```

更新 pnpm：

```bash
corepack prepare pnpm@latest --activate
```

---

## 八、安装 Python 基础环境

Ubuntu 24.04 自带系统 Python。不要删除或替换 `/usr/bin/python3`，系统工具可能依赖它。

安装基础组件：

```bash
sudo apt install -y \
  python3 \
  python3-pip \
  python3-venv \
  python3-dev \
  pipx
```

检查：

```bash
python3 --version
pip3 --version
```

### 8.1 使用系统 Python 创建虚拟环境

```bash
mkdir -p ~/projects/python-demo
cd ~/projects/python-demo

python3 -m venv .venv
source .venv/bin/activate
```

验证：

```bash
which python
python --version
```

退出虚拟环境：

```bash
deactivate
```

> `venv` 是 Python 虚拟环境工具；你提到的“pvenv”更可能是 `pyenv`，它用于管理多个 Python 版本。

---

## 九、安装 pyenv 管理 Python 版本

pyenv 用于在同一用户下安装和切换多个 Python 版本。

### 9.1 安装编译依赖

```bash
sudo apt update
sudo apt install -y \
  make \
  build-essential \
  libssl-dev \
  zlib1g-dev \
  libbz2-dev \
  libreadline-dev \
  libsqlite3-dev \
  wget \
  curl \
  llvm \
  libncursesw5-dev \
  xz-utils \
  tk-dev \
  libxml2-dev \
  libxmlsec1-dev \
  libffi-dev \
  liblzma-dev
```

### 9.2 安装 pyenv

```bash
curl -fsSL https://pyenv.run | bash
```

配置 Bash：

```bash
cat >> ~/.bashrc <<'EOF_PYENV'

export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - bash)"
EOF_PYENV

cat >> ~/.profile <<'EOF_PYENV_PROFILE'

export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - bash)"
EOF_PYENV_PROFILE

exec "$SHELL"
```

验证：

```bash
pyenv --version
```

### 9.3 安装和切换 Python

查看可安装版本：

```bash
pyenv install --list
```

安装某个版本：

```bash
pyenv install 3.12
```

pyenv 会将 `3.12` 自动解析为它当前已知的最新 3.12.x 版本。

设置当前用户默认版本：

```bash
pyenv global 3.12
```

为当前项目固定版本：

```bash
cd ~/projects/python-demo
pyenv local 3.12
```

检查：

```bash
python --version
pyenv versions
pyenv version
```

恢复系统 Python：

```bash
pyenv global system
```

---

## 十、安装 uv

uv 是 Astral 提供的高速 Python 包和项目管理工具，可以管理 Python、虚拟环境、依赖和锁文件。

安装：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

加载环境：

```bash
source ~/.bashrc
```

如果找不到命令：

```bash
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

验证：

```bash
uv --version
```

### 10.1 使用 uv 管理 Python

查看可安装版本：

```bash
uv python list
```

安装 Python 3.12：

```bash
uv python install 3.12
```

### 10.2 创建 uv 项目

```bash
mkdir -p ~/projects/uv-demo
cd ~/projects/uv-demo

uv init
uv venv
source .venv/bin/activate
```

安装依赖：

```bash
uv add requests
uv add --dev pytest ruff
```

运行：

```bash
uv run python main.py
uv run pytest
```

同步锁定依赖：

```bash
uv sync
```

### 10.3 pyenv 和 uv 如何选择

推荐方案：

- 需要维护很多历史 Python 版本：使用 `pyenv`。
- 新 Python 项目、依赖和虚拟环境：优先使用 `uv`。
- 简单项目：只使用 `uv` 通常已经足够。
- 不要同时让 pyenv 和 uv 在同一个项目中反复覆盖 Python 选择。

一个清晰的组合是：

```text
pyenv：控制全局或项目基础 Python 版本
uv：创建虚拟环境、管理依赖和运行项目
```

---

## 十一、配置 Python 国内镜像

### 11.1 pip 配置清华镜像

```bash
mkdir -p ~/.config/pip

cat > ~/.config/pip/pip.conf <<'EOF_PIP'
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
timeout = 60

[install]
trusted-host = pypi.tuna.tsinghua.edu.cn
EOF_PIP
```

检查：

```bash
pip config list
```

临时使用官方 PyPI：

```bash
pip install 包名 -i https://pypi.org/simple
```

### 11.2 uv 配置镜像

临时指定镜像：

```bash
uv add requests --default-index https://pypi.tuna.tsinghua.edu.cn/simple
```

也可以设置环境变量：

```bash
cat >> ~/.bashrc <<'EOF_UV_INDEX'
export UV_DEFAULT_INDEX="https://pypi.tuna.tsinghua.edu.cn/simple"
EOF_UV_INDEX

source ~/.bashrc
```

恢复官方源：

```bash
unset UV_DEFAULT_INDEX
```

并删除 `~/.bashrc` 中对应配置。

> 对安全敏感或生产构建，建议优先使用官方 PyPI，或使用公司内部经过审计的制品库。

---

## 十二、安装 Java

Ubuntu 24.04 可以直接安装 OpenJDK。

### 12.1 安装 Java 21

Java 21 是 LTS 版本，适合新项目：

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
```

检查：

```bash
java -version
javac -version
```

查看 Java 安装路径：

```bash
readlink -f "$(which java)"
```

### 12.2 配置 JAVA_HOME

自动获取 Java 目录：

```bash
JAVA_HOME_PATH=$(dirname "$(dirname "$(readlink -f "$(which java)")")")
echo "$JAVA_HOME_PATH"
```

写入环境变量：

```bash
cat >> ~/.bashrc <<EOF_JAVA

export JAVA_HOME="$JAVA_HOME_PATH"
export PATH="\$JAVA_HOME/bin:\$PATH"
EOF_JAVA

source ~/.bashrc
```

检查：

```bash
echo "$JAVA_HOME"
java -version
```

### 12.3 多 Java 版本切换

如果安装了多个版本：

```bash
sudo update-alternatives --config java
sudo update-alternatives --config javac
```

需要更灵活的用户级 Java 版本管理时，可以另行使用 SDKMAN，但生产服务器不一定需要。

### 12.4 可选：Maven 和 Gradle

```bash
sudo apt install -y maven gradle
```

检查：

```bash
mvn -v
gradle -v
```

Ubuntu 仓库中的 Maven、Gradle 版本可能不是最新版。需要固定新版本时，建议使用 Maven Wrapper 或 Gradle Wrapper：

```text
./mvnw
./gradlew
```

---

## 十三、安装 Docker 和 Docker Compose

建议使用 Docker 官方 APT 仓库，不要混装 Ubuntu 的 `docker.io` 和 Docker 官方 `docker-ce`。

### 13.1 删除可能冲突的包

```bash
sudo apt remove -y \
  docker.io \
  docker-compose \
  docker-compose-v2 \
  docker-doc \
  podman-docker \
  containerd \
  runc || true
```

### 13.2 添加 Docker 官方仓库

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc
```

写入仓库：

```bash
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF_DOCKER
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF_DOCKER
```

安装：

```bash
sudo apt update
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
```

### 13.3 启动 Docker

```bash
sudo systemctl enable --now docker
sudo systemctl status docker --no-pager
```

测试：

```bash
sudo docker run --rm hello-world
```

检查 Compose：

```bash
docker compose version
```

注意是：

```bash
docker compose
```

而不是旧版命令：

```bash
docker-compose
```

### 13.4 允许普通用户使用 Docker

```bash
sudo usermod -aG docker "$USER"
```

重新登录 SSH，或者当前终端执行：

```bash
newgrp docker
```

测试：

```bash
docker run --rm hello-world
```

> 警告：`docker` 用户组实际上拥有接近 root 的系统控制能力。只将可信用户加入该组。

### 13.5 Docker 日志轮转

防止容器日志占满磁盘：

```bash
sudo mkdir -p /etc/docker

sudo tee /etc/docker/daemon.json > /dev/null <<'EOF_DOCKER_DAEMON'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
EOF_DOCKER_DAEMON
```

检查 JSON：

```bash
jq . /etc/docker/daemon.json
```

重启 Docker：

```bash
sudo systemctl restart docker
```

### 13.6 Docker 国内镜像说明

公共 Docker 镜像加速地址变化频繁，不建议复制来源不明、无法确认维护状态的加速地址。

更稳妥的方式：

1. 使用云服务器厂商控制台提供的专属镜像加速地址。
2. 使用公司内部 Harbor 或 Registry 代理缓存。
3. 为常用镜像配置可信的私有仓库。

拿到可信地址后，可合并到 `/etc/docker/daemon.json`：

```json
{
  "registry-mirrors": [
    "https://你的可信镜像加速地址"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
```

然后：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
docker info
```

---

## 十四、安装 AI 编程工具

建议先确认：

```bash
node -v
npm -v
```

如果 Claude Code 通过 npm 安装，推荐 Node.js 22 或更高版本。

### 14.1 安装 OpenAI Codex CLI

用户要求使用 npm 安装：

```bash
npm install -g @openai/codex
```

检查：

```bash
codex --version
```

启动：

```bash
cd ~/projects/你的项目
codex
```

首次运行按提示登录。

当前官方也提供 Linux 独立安装脚本：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

二选一即可，不建议同时维护两套安装来源。

更新 npm 版本：

```bash
npm install -g @openai/codex@latest
```

### 14.2 安装 Claude Code

通过 npm 安装：

```bash
npm install -g @anthropic-ai/claude-code
```

检查：

```bash
claude --version
claude doctor
```

启动：

```bash
cd ~/projects/你的项目
claude
```

当前官方更推荐原生安装器：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

同样二选一即可。

更新 npm 版本：

```bash
npm install -g @anthropic-ai/claude-code@latest
```

不要执行：

```bash
sudo npm install -g @anthropic-ai/claude-code
```

### 14.3 安装 OpenCode

通过 npm 安装：

```bash
npm install -g opencode-ai
```

检查：

```bash
opencode --version
```

启动：

```bash
cd ~/projects/你的项目
opencode
```

运行单次任务：

```bash
opencode run "解释这个项目的结构"
```

官方安装脚本方式：

```bash
curl -fsSL https://opencode.ai/install | bash
```

二选一即可。

更新：

```bash
npm install -g opencode-ai@latest
```

### 14.4 安装 Hermes Agent

Hermes Agent 官方安装方式不是 npm 全局包。不要随意安装 npm 中名称相似的第三方包。

使用官方脚本：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

重新加载环境：

```bash
source ~/.bashrc
```

检查：

```bash
hermes --help
```

运行初始化向导：

```bash
hermes setup
```

启动交互模式：

```bash
hermes
```

选择模型：

```bash
hermes model
```

配置工具：

```bash
hermes tools
```

### 14.5 一次性安装三个 npm AI CLI

确认 Node.js 22 已启用：

```bash
nvm use 22
```

安装：

```bash
npm install -g \
  @openai/codex \
  @anthropic-ai/claude-code \
  opencode-ai
```

检查：

```bash
codex --version
claude --version
opencode --version
```

### 14.6 AI CLI 使用安全建议

这些工具可能读取文件、修改代码和执行终端命令：

- 只在明确的项目目录中启动。
- 不要直接在 `/`、`/etc`、`/root` 等目录启动 Agent。
- 不要无条件允许危险命令。
- 执行任务前提交 Git：

```bash
git add .
git commit -m "checkpoint before agent changes"
```

- 不要把 API Key 写入 Git 仓库。
- 使用 `.env` 时加入 `.gitignore`：

```bash
echo '.env' >> .gitignore
```

---

## 十五、推荐安装的服务器工具

### 15.1 ripgrep：高速文本搜索

```bash
sudo apt install -y ripgrep
```

使用：

```bash
rg "关键字" .
```

### 15.2 fd：更友好的 find

Ubuntu 包名通常为 `fd-find`：

```bash
sudo apt install -y fd-find
```

创建命令别名：

```bash
mkdir -p ~/.local/bin
ln -sf "$(command -v fdfind)" ~/.local/bin/fd
```

### 15.3 fzf：模糊搜索

```bash
sudo apt install -y fzf
```

### 15.4 bat：更友好的 cat

```bash
sudo apt install -y bat
```

Ubuntu 中命令可能叫 `batcat`：

```bash
ln -sf "$(command -v batcat)" ~/.local/bin/bat
```

### 15.5 btop：系统资源监控

```bash
sudo apt install -y btop
```

### 15.6 ncdu：磁盘空间分析

```bash
sudo apt install -y ncdu
```

使用：

```bash
sudo ncdu /
```

### 15.7 lsof：端口和文件占用排查

```bash
sudo apt install -y lsof
```

查看 8080 端口：

```bash
sudo lsof -i :8080
```

### 15.8 HTTP 和网络排查

```bash
sudo apt install -y \
  httpie \
  socat \
  nmap \
  tcpdump
```

常用：

```bash
curl -I https://example.com
ss -lntp
sudo lsof -i :8080
```

### 15.9 ShellCheck

检查 Shell 脚本：

```bash
sudo apt install -y shellcheck
```

### 15.10 fail2ban

用于限制 SSH 等服务的暴力尝试：

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
sudo systemctl status fail2ban --no-pager
```

### 15.11 Nginx

需要反向代理、HTTPS 或静态网站时安装：

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

不要在暂时不需要时开放 Nginx 端口。

### 15.12 数据库客户端

只安装客户端，不必在小服务器上全部运行数据库服务：

```bash
sudo apt install -y \
  redis-tools \
  postgresql-client \
  mysql-client
```

### 15.13 命令行增强工具汇总

```bash
sudo apt install -y \
  ripgrep \
  fd-find \
  fzf \
  bat \
  btop \
  ncdu \
  lsof \
  shellcheck
```

---

## 十六、防火墙和基础安全配置

### 16.1 启用 UFW

先放行 SSH：

```bash
sudo ufw allow OpenSSH
```

如果 SSH 使用自定义端口，例如 2222：

```bash
sudo ufw allow 2222/tcp
```

启用：

```bash
sudo ufw enable
sudo ufw status verbose
```

开放 Web 端口时：

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

不要直接把数据库端口暴露到公网，例如：

```text
3306 MySQL
5432 PostgreSQL
6379 Redis
27017 MongoDB
```

### 16.2 启用自动安全更新

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 16.3 设置时区

```bash
sudo timedatectl set-timezone Asia/Shanghai
```

如果主要按台湾时间使用：

```bash
sudo timedatectl set-timezone Asia/Taipei
```

检查：

```bash
timedatectl
```

### 16.4 禁止 root SSH 登录

确认普通用户 SSH 和 sudo 均正常后，再修改：

```bash
sudo nano /etc/ssh/sshd_config
```

设置：

```text
PermitRootLogin no
```

检查配置：

```bash
sudo sshd -t
```

无输出后重载：

```bash
sudo systemctl reload ssh
```

务必保持当前 SSH 会话，并在新窗口测试普通用户登录。

---

## 十七、创建项目目录

推荐在普通用户家目录工作：

```bash
mkdir -p ~/projects
mkdir -p ~/workspace
mkdir -p ~/.local/bin
```

推荐目录：

```text
/home/用户名/projects/
/home/用户名/workspace/
```

部署型项目也可以放在：

```text
/opt/项目名/
```

创建并授权：

```bash
sudo mkdir -p /opt/my-app
sudo chown -R "$USER":"$USER" /opt/my-app
```

不要把日常项目放在：

```text
/root/
```

---

## 十八、最终环境检查

执行以下命令：

```bash
printf '\n=== 系统 ===\n'
cat /etc/os-release | grep -E '^(NAME|VERSION)='
uname -m

printf '\n=== 用户 ===\n'
whoami
id

printf '\n=== Git ===\n'
git --version

printf '\n=== Node.js ===\n'
command -v nvm >/dev/null && nvm --version || echo 'NVM 未加载'
node -v
npm -v
pnpm -v

printf '\n=== Python ===\n'
python3 --version
command -v pyenv >/dev/null && pyenv --version || echo 'pyenv 未安装或未加载'
uv --version

printf '\n=== Java ===\n'
java -version
javac -version

printf '\n=== Docker ===\n'
docker --version
docker compose version

printf '\n=== AI CLI ===\n'
codex --version
claude --version
opencode --version
hermes --help >/dev/null && echo 'Hermes Agent 已安装'
```

某一项尚未安装时，命令可能提示找不到，不影响其他项。

---

## 十九、常见问题

### 19.1 `nvm: command not found`

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc
```

### 19.2 `claude`、`uv` 或 `hermes` 找不到

```bash
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

然后检查：

```bash
which claude
which uv
which hermes
```

### 19.3 npm 安装提示权限不足 `EACCES`

先确认 Node 来自 NVM：

```bash
which node
which npm
```

正常路径应类似：

```text
/home/用户名/.nvm/versions/node/v22.x.x/bin/node
```

如果是 `/usr/bin/node`，执行：

```bash
source ~/.bashrc
nvm use 22
```

不要通过 `sudo npm install -g` 绕过权限问题。

### 19.4 sudo 下 Node.js 版本不一致

这是正常现象。NVM 是按用户安装的，`sudo` 默认不会使用普通用户的 NVM 环境。

正确方式：

```bash
npm install -g 包名
```

而不是：

```bash
sudo npm install -g 包名
```

### 19.5 pyenv 安装 Python 失败

确认编译依赖已安装：

```bash
sudo apt install -y \
  build-essential libssl-dev zlib1g-dev libbz2-dev \
  libreadline-dev libsqlite3-dev libffi-dev liblzma-dev \
  libncursesw5-dev xz-utils tk-dev
```

查看详细日志：

```bash
pyenv install -v 3.12
```

### 19.6 Docker 普通用户权限不足

```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

仍有问题时退出 SSH 后重新登录。

### 19.7 Docker 修改 daemon.json 后启动失败

检查 JSON：

```bash
jq . /etc/docker/daemon.json
```

查看日志：

```bash
sudo systemctl status docker --no-pager
sudo journalctl -u docker -n 100 --no-pager
```

### 19.8 国内镜像安装不到最新包

镜像站存在同步延迟。可以临时切回官方源：

```bash
npm config set registry https://registry.npmjs.org
```

```bash
unset UV_DEFAULT_INDEX
```

pip 临时使用官方源：

```bash
pip install 包名 -i https://pypi.org/simple
```

### 19.9 AI CLI 登录失败或 403

可能原因：

- 服务器出口 IP 或所在地区受到服务限制。
- 账号套餐或组织权限不支持。
- OAuth 回调在纯服务器环境中无法正常完成。
- 代理只配置在浏览器，没有配置到服务器进程。
- API Key、环境变量或自定义网关配置错误。

先检查网络：

```bash
curl -I https://github.com
curl -I https://registry.npmjs.org
```

不要把账号 Token 或 API Key 发给他人。

---

## 二十、推荐安装顺序

建议严格按以下顺序初始化：

```text
1. 创建普通用户并配置 sudo、SSH 密钥
2. 更新 Ubuntu 和安装基础工具
3. 根据服务器位置选择是否配置 APT 国内镜像
4. 配置 Git 和 SSH 密钥
5. 安装 NVM
6. 通过 NVM 安装 Node.js 22 或当前 LTS
7. 配置 npm 镜像并安装 pnpm
8. 安装系统 Python 基础组件
9. 按需安装 pyenv
10. 安装 uv
11. 安装 Java 21
12. 安装 Docker Engine 和 Docker Compose Plugin
13. 安装 Codex、Claude Code、OpenCode
14. 使用官方脚本安装 Hermes Agent
15. 安装 ripgrep、fd、fzf、bat、btop、ncdu 等工具
16. 配置 UFW、自动安全更新和 Docker 日志轮转
17. 创建 ~/projects 并在项目目录中使用 AI Agent
```

---

## 官方参考资料

- NVM：https://github.com/nvm-sh/nvm
- pyenv：https://github.com/pyenv/pyenv
- uv：https://docs.astral.sh/uv/
- Docker Ubuntu：https://docs.docker.com/engine/install/ubuntu/
- Codex CLI：https://developers.openai.com/codex/cli
- Claude Code：https://docs.anthropic.com/en/docs/claude-code/setup
- OpenCode：https://opencode.ai/docs/
- Hermes Agent：https://hermes-agent.nousresearch.com/docs/getting-started/installation

---

## 重要提醒

1. 不要用 root 用户长期开发。
2. 不要对 NVM 管理的 npm 执行 `sudo npm install -g`。
3. 不要替换 Ubuntu 系统自带的 `/usr/bin/python3`。
4. 不要同时混装 `docker.io` 和 Docker 官方 `docker-ce`。
5. 国内镜像只是加速选项，出现同步问题时切回官方源。
6. Docker 用户组权限接近 root，只授权给可信用户。
7. AI Agent 可能执行命令和修改文件，使用前创建 Git 提交点。
8. 不要把 API Key、Token、私钥和 `.env` 提交到仓库。
