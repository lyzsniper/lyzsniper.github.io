# Linux 服务器普通用户配置与安全加固教程

> 适用系统：Ubuntu、Debian，以及大多数使用 OpenSSH 的 Linux 服务器。
>
> 本教程默认你当前已经使用 `root` 用户登录服务器，并准备创建一个普通用户进行日常操作。

---

## 一、为什么不建议长期使用 root

`root` 拥有系统最高权限，任何误操作都会直接影响整个系统，例如：

- 删除系统文件
- 修改错误的系统配置
- 安装来源不明的软件
- 运行存在安全漏洞的程序
- 因命令输入错误导致服务异常

推荐的使用方式是：

- 日常登录使用普通用户
- 项目文件放在普通用户目录
- 只有安装软件、修改系统配置、管理服务时使用 `sudo`
- 确认普通用户可正常登录后，再关闭 root 的 SSH 登录

---

## 二、创建普通用户

以下示例用户名为 `jensen`，请替换为你自己的用户名。

使用 root 用户执行：

```bash
adduser jensen
```

系统会提示设置密码：

```text
New password:
Retype new password:
```

后续姓名、电话等信息可以直接按回车跳过。

查看用户是否创建成功：

```bash
id jensen
```

正常会看到类似输出：

```text
uid=1000(jensen) gid=1000(jensen) groups=1000(jensen)
```

---

## 三、授予 sudo 权限

Ubuntu、Debian 系统执行：

```bash
usermod -aG sudo jensen
```

检查用户组：

```bash
groups jensen
```

正常输出中应该包含 `sudo`：

```text
jensen : jensen sudo
```

### CentOS、Rocky Linux、AlmaLinux

这些系统通常使用 `wheel` 用户组：

```bash
usermod -aG wheel jensen
```

检查：

```bash
groups jensen
```

---

## 四、切换到普通用户测试

当前 root SSH 窗口先不要关闭。

切换用户：

```bash
su - jensen
```

检查当前用户：

```bash
whoami
```

应输出：

```text
jensen
```

测试 sudo：

```bash
sudo whoami
```

输入普通用户密码后，应输出：

```text
root
```

也可以测试软件包管理命令：

```bash
sudo apt update
```

返回 root 用户：

```bash
exit
```

---

## 五、为普通用户配置 SSH 密钥

推荐使用 SSH 密钥登录，而不是只使用密码。

### 方案一：复制 root 已有的 SSH 公钥授权

如果当前 root 用户已经通过 SSH 密钥登录，可以将 root 的授权文件复制给普通用户。

使用 root 执行：

```bash
mkdir -p /home/jensen/.ssh
cp /root/.ssh/authorized_keys /home/jensen/.ssh/authorized_keys
chown -R jensen:jensen /home/jensen/.ssh
chmod 700 /home/jensen/.ssh
chmod 600 /home/jensen/.ssh/authorized_keys
```

检查权限：

```bash
ls -ld /home/jensen/.ssh
ls -l /home/jensen/.ssh/authorized_keys
```

权限应接近：

```text
drwx------ jensen jensen /home/jensen/.ssh
-rw------- jensen jensen /home/jensen/.ssh/authorized_keys
```

然后在本地电脑新开一个终端测试：

```bash
ssh jensen@服务器IP
```

不要关闭当前 root SSH 会话，直到普通用户确认可以正常登录。

---

### 方案二：从本地电脑上传 SSH 公钥

在自己的电脑上生成密钥：

```bash
ssh-keygen -t ed25519
```

一路按回车即可。

将公钥上传到服务器：

```bash
ssh-copy-id jensen@服务器IP
```

之后登录：

```bash
ssh jensen@服务器IP
```

### Windows 没有 ssh-copy-id 时

先在 Windows PowerShell 查看公钥：

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

复制完整输出。

然后使用密码登录服务器，切换到普通用户并执行：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

将公钥粘贴进去，保存后执行：

```bash
chmod 600 ~/.ssh/authorized_keys
```

---

## 六、测试普通用户管理权限

登录普通用户：

```bash
ssh jensen@服务器IP
```

测试安装软件：

```bash
sudo apt update
sudo apt install -y curl git
```

测试服务管理：

```bash
sudo systemctl status ssh
```

临时进入 root Shell：

```bash
sudo -i
```

退出 root Shell：

```bash
exit
```

日常推荐直接给单条命令加 `sudo`：

```bash
sudo apt install nginx
sudo systemctl restart nginx
sudo nano /etc/nginx/nginx.conf
```

不建议长期停留在：

```bash
sudo -i
```

---

## 七、禁止 root 通过 SSH 登录

必须先确认：

1. 普通用户可以通过 SSH 登录
2. 普通用户可以正常执行 `sudo`
3. SSH 密钥登录已经测试成功
4. 当前 root SSH 窗口仍然保持连接

编辑 SSH 配置：

```bash
sudo nano /etc/ssh/sshd_config
```

找到或添加：

```text
PermitRootLogin no
```

检查 SSH 配置语法：

```bash
sudo sshd -t
```

如果没有任何输出，通常表示语法正确。

Ubuntu、Debian 重载 SSH：

```bash
sudo systemctl reload ssh
```

部分系统服务名称是 `sshd`：

```bash
sudo systemctl reload sshd
```

然后必须新开终端测试：

```bash
ssh jensen@服务器IP
```

确认普通用户可以登录后，再退出旧的 root 会话。

---

## 八、关闭 SSH 密码登录

这一步安全性更高，但必须确保密钥登录已经成功。

编辑配置：

```bash
sudo nano /etc/ssh/sshd_config
```

建议设置：

```text
PubkeyAuthentication yes
PasswordAuthentication no
PermitRootLogin no
KbdInteractiveAuthentication no
```

检查配置：

```bash
sudo sshd -t
```

重载 SSH：

```bash
sudo systemctl reload ssh
```

或者：

```bash
sudo systemctl reload sshd
```

再次新开终端验证：

```bash
ssh jensen@服务器IP
```

在确认新连接正常之前，不要关闭原有 SSH 窗口。

---

## 九、配置防火墙

Ubuntu、Debian 可以使用 UFW。

先确认 SSH 端口：

```bash
sudo sshd -T | grep '^port'
```

默认 SSH 端口通常是 `22`。

放行 SSH：

```bash
sudo ufw allow OpenSSH
```

或者明确放行 22 端口：

```bash
sudo ufw allow 22/tcp
```

如果 SSH 使用其他端口，例如 `2222`：

```bash
sudo ufw allow 2222/tcp
```

启用防火墙：

```bash
sudo ufw enable
```

查看状态：

```bash
sudo ufw status verbose
```

如果服务器还运行 Web 服务，可以按需放行：

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

不要直接放行所有端口。

---

## 十、项目目录建议

普通用户的项目推荐放在：

```text
/home/jensen/projects/
```

创建目录：

```bash
mkdir -p ~/projects
```

进入目录：

```bash
cd ~/projects
```

不要把日常项目长期放在：

```text
/root/
```

系统级部署项目也可以放在：

```text
/opt/项目名/
```

例如：

```bash
sudo mkdir -p /opt/my-app
sudo chown -R jensen:jensen /opt/my-app
```

之后普通用户就可以直接操作：

```bash
cd /opt/my-app
```

网站静态文件常见目录：

```text
/var/www/项目名/
```

例如：

```bash
sudo mkdir -p /var/www/my-site
sudo chown -R jensen:jensen /var/www/my-site
```

---

## 十一、普通用户安装 NVM、Node.js 和开发工具

NVM、Node.js、Claude Code、Codex 等开发工具，建议直接在普通用户下安装。

确认当前用户：

```bash
whoami
```

应该输出普通用户名，而不是 `root`。

例如安装 NVM：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc
```

安装 Node.js LTS：

```bash
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'
```

不要使用：

```bash
sudo nvm install --lts
```

也不要使用：

```bash
sudo npm install -g 某个包
```

如果 Node.js 通过 NVM 安装，全局 npm 包也应由当前普通用户管理。

---

## 十二、文件权限基本原则

查看文件权限：

```bash
ls -la
```

修改文件所有者：

```bash
sudo chown 用户名:用户组 文件或目录
```

例如：

```bash
sudo chown -R jensen:jensen /opt/my-app
```

常见权限：

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

不要为了省事使用：

```bash
chmod -R 777 目录
```

`777` 会允许所有用户读、写、执行，容易产生安全问题。

---

## 十三、推荐的最终 SSH 配置

编辑：

```bash
sudo nano /etc/ssh/sshd_config
```

推荐关键配置：

```text
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
```

修改后检查：

```bash
sudo sshd -t
```

确认无错误后重载：

```bash
sudo systemctl reload ssh
```

如果服务名为 `sshd`：

```bash
sudo systemctl reload sshd
```

---

## 十四、完整操作顺序

建议严格按照以下顺序操作：

```text
使用 root 登录服务器
→ 创建普通用户
→ 加入 sudo 或 wheel 用户组
→ 测试 sudo 权限
→ 配置普通用户 SSH 密钥
→ 新开窗口测试普通用户登录
→ 配置并启用防火墙
→ 禁止 root SSH 登录
→ 再次测试普通用户登录
→ 关闭 SSH 密码登录
→ 日常只使用普通用户操作
```

---

## 十五、Ubuntu 一键执行版

将下面的 `jensen` 替换为你的用户名。

### 创建用户并授予 sudo 权限

```bash
adduser jensen
usermod -aG sudo jensen
groups jensen
```

### 复制 root SSH 密钥授权

```bash
mkdir -p /home/jensen/.ssh
cp /root/.ssh/authorized_keys /home/jensen/.ssh/authorized_keys
chown -R jensen:jensen /home/jensen/.ssh
chmod 700 /home/jensen/.ssh
chmod 600 /home/jensen/.ssh/authorized_keys
```

### 测试用户

```bash
su - jensen
whoami
sudo whoami
exit
```

### 配置防火墙

```bash
ufw allow OpenSSH
ufw enable
ufw status verbose
```

### 禁止 root SSH 登录

```bash
nano /etc/ssh/sshd_config
```

设置：

```text
PermitRootLogin no
```

检查并重载：

```bash
sshd -t
systemctl reload ssh
```

---

## 十六、常见问题

### 1. sudo: command not found

部分精简系统没有安装 sudo。

使用 root 执行：

```bash
apt update
apt install -y sudo
```

然后重新加入 sudo 组：

```bash
usermod -aG sudo jensen
```

---

### 2. 用户已经加入 sudo 组，但 sudo 仍然不可用

重新登录用户，或者执行：

```bash
su - jensen
```

用户组变更通常需要重新登录后生效。

---

### 3. SSH 提示 Permission denied (publickey)

检查权限：

```bash
sudo chown -R jensen:jensen /home/jensen/.ssh
sudo chmod 700 /home/jensen/.ssh
sudo chmod 600 /home/jensen/.ssh/authorized_keys
```

检查公钥内容：

```bash
sudo cat /home/jensen/.ssh/authorized_keys
```

查看 SSH 日志：

```bash
sudo journalctl -u ssh -n 100 --no-pager
```

或者：

```bash
sudo journalctl -u sshd -n 100 --no-pager
```

---

### 4. 修改 SSH 配置后无法重载

先检查配置：

```bash
sudo sshd -t
```

查看服务状态：

```bash
sudo systemctl status ssh --no-pager
```

不要在配置检查失败时重启 SSH 服务。

---

### 5. 普通用户无法操作原来 root 创建的项目

将项目所有者改为普通用户：

```bash
sudo chown -R jensen:jensen /项目路径
```

例如：

```bash
sudo chown -R jensen:jensen /opt/my-app
```

---

## 十七、日常使用示例

登录服务器：

```bash
ssh jensen@服务器IP
```

进入项目：

```bash
cd ~/projects/my-app
```

更新代码：

```bash
git pull
```

安装项目依赖：

```bash
npm install
```

管理系统服务：

```bash
sudo systemctl restart nginx
```

修改系统配置：

```bash
sudo nano /etc/nginx/nginx.conf
```

查看日志：

```bash
sudo journalctl -u nginx -n 100 --no-pager
```

这种模式既能正常管理服务器，也能降低长期使用 root 带来的风险。
