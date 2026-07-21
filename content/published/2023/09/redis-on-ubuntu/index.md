---
title: 在 Ubuntu 安装及配置 Redis
slug: redis-on-ubuntu
date: 2023-09-23 18:00:00
category: 技术/后端
tags: [Redis, Ubuntu, Linux]
summary: Ubuntu 上 Redis 的安装与基础配置（远程连接、密码、防火墙）
status: published
---

# 在 Ubuntu 安装及配置 Redis

## 安装

在 ubuntu 安装 redis：

```bash
sudo apt-get install -y redis-server
```

启动 `redis-server` 查看是否下载成功。安装成功后会以守护进程方式运行。

## 远程连接配置

如果想远程连接 redis 服务器，可以继续如下配置。

### 查看 Redis 进程

在 Linux 系统中用来查看有关 Redis 进程的信息：

```bash
ps -aux | grep redis
```

### 关闭 redis-server 进程

```bash
kill -9 <pid>
```

### 配置 redis.conf

```bash
sudo vim /etc/redis/redis.conf
```

需要修改的关键配置项：

```conf
# 允许所有 IP 访问（生产环境建议限制）
bind 0.0.0.0

# 关闭保护模式
protected-mode no

# 守护进程
daemonize yes

# 设置密码
requirepass your-strong-password
```

### 重启 Redis

```bash
sudo systemctl restart redis-server
```

### 防火墙放行 6379

```bash
sudo ufw allow 6379/tcp
# 或 iptables
sudo iptables -A INPUT -p tcp --dport 6379 -j ACCEPT
```

## 测试连接

```bash
redis-cli -h <server-ip> -p 6379 -a your-strong-password
```

输入 `PING`，返回 `PONG` 即表示配置成功。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `redis-cli` | 连接本地 Redis |
| `redis-cli ping` | 测试连通性 |
| `redis-cli info` | 查看服务器信息 |
| `redis-cli shutdown` | 关闭服务 |
| `keys *` | 列出所有 key（生产环境慎用） |
| `flushall` | 清空所有数据库 |

## 小结

至此 Redis 已经在 Ubuntu 上完整安装并支持远程连接。生产环境请务必：
- 设置强密码
- 限制 bind IP
- 关闭 protected-mode 后用防火墙兜底
- 启用 appendonly 持久化
