# Gradle 速查笔记

> 一篇给 Java 工程师看的 Gradle 速查笔记。覆盖三件事：日常怎么用 Gradle、在 IntelliJ IDEA 里怎么玩转它、以及它和 Maven 到底差在哪、该选谁。
>
> 内容基于一份 IDEA Gradle Tasks 实操手册整理，并补充了官方文档里关于 Gradle / Maven 对照的事实，方便收藏后直接翻。

---

## 一、为什么是 Gradle

如果你写过 Java 项目，大概率逃不开两个构建工具：**Maven** 和 **Gradle**。老项目里 Maven 居多，新项目（尤其是 Spring Boot 官方脚手架、Android）越来越默认 Gradle。

Gradle 最大的卖点就三个：**快**（增量构建 + 构建缓存 + 守护进程）、**灵活**（构建脚本是真正的代码，不是 XML 声明）、**对多模块友好**。但它也确实比 Maven 多一层学习成本。

下面按"会用 → 用好 → 选型"的顺序过一遍。

---

## 二、Gradle 常见使用方法

### 2.1 先认清楚：gradlew 才是正经入口

每个 Gradle 项目根目录都会带一个 `gradlew`（Linux/Mac）或 `gradlew.bat`（Windows），这叫 **Gradle Wrapper**。它保证团队每个人、CI 机器上用的是同一个 Gradle 版本，避免"我本地能跑你那报错"的经典惨剧。

> ⚠️ 优先用项目自带的 `gradlew`，别用本机全局装的 `gradle`。版本不一致是各种诡异报错的根源。

```bash
# 项目根目录执行
./gradlew build          # Linux/Mac
gradlew.bat build        # Windows
```

下文命令默认省略 `./`，你本地记得带上。

### 2.2 核心构建任务（build 组）

| 任务 | 作用 | 日常场景 |
| --- | --- | --- |
| `clean` | 删除 `build` 目录，清掉所有编译产物、旧 jar | 改了配置/build 脚本后，先 clean 再构建，避免旧缓存干扰 |
| `classes` | 只编译主业务 Java 代码，生成 class 文件，**不打包、不跑测试** | 只想看编译报错，不想等打包 |
| `testClasses` | 只编译测试代码 | 只编译单元测试 |
| `jar` | 把已编译的 class 打成 jar，输出到 `build/libs` | 只打 jar，**不自动编译、不跑测试**，容易打旧 class，慎用 |
| `assemble` | 生成所有产出物（jar 等），**跳过测试** | 快速打包，省时间 |
| `build` | 完整构建：编译 → 执行单元测试 → 打 jar；测试失败直接终止 | 正式校验，CI 里的基本盘 |
| `buildNeeded` | 构建当前模块 + **它所依赖的所有子模块** | 多模块项目，本模块依赖别人时用 |
| `buildDependents` | 构建当前模块 + **所有依赖本模块的上层模块** | 多模块，别人依赖你的 jar，一次性全构建 |

**一句话口诀：**

- `assemble` = 打包，不跑测试；
- `build` = 打包 + 跑测试；
- 改完代码出怪事，先 `clean` 清缓存。

### 2.3 发布相关（publishing 组，maven-publish 插件）

当你写的不是业务应用、而是一个**给别人用的库/SDK** 时，需要把它发布出去。

| 任务 | 作用 | 场景 |
| --- | --- | --- |
| `generatePomFileForMavenJavaPublication` | 生成 `pom-default.xml`，记录 groupId/artifactId/version 和依赖列表 | 手动核对生成的 pom 对不对 |
| `publishToMavenLocal` | 把 jar + pom 发到本机 `~/.m2/repository` 本地仓库 | ⭐高频！本地调试，别的模块要引用你的 jar 时点这个 |
| `publishMavenJavaPublicationToMavenRepository` | 发布到**远程 Maven 私服**（需配地址/账号） | CI 发布到公司私服 |
| `publishAllPublicationsToMavenRepository` | 把所有发布配置都推到远程私服 | 多套发布配置时用 |
| `publish` | 总入口，本地 + 远程一起触发 | 一般别直接点，容易误推远程 |

**本地调试库的标准流水线：**

```bash
gradlew clean build publishToMavenLocal
```

跑完之后，别的工程就能在 `build.gradle` 里 `implementation 'com.xxx:your-lib:1.0'` 引用了。

### 2.4 调试排查（help 组，真·神器）

| 任务 | 作用 |
| --- | --- |
| `dependencies` | 打印完整依赖树，**排查 jar 冲突就靠它** |
| `dependencyInsight --dependency guava` | 精准定位某个依赖从哪来、被谁强制升/降级 |
| `projects` | 列出所有子模块，多模块项目认模块名 |
| `properties` | 打印项目全部属性（version、group 等） |

```bash
# 排查 guava 版本冲突
gradlew dependencyInsight --dependency guava

# 依赖树导出到文件慢慢看
gradlew dependencies > dep.txt
```

### 2.5 测试相关（verification 组）

```bash
gradlew test                                    # 跑全部单元测试
gradlew check                                   # 单元测试 + 代码检查（checkstyle 等）
gradlew test --tests "com.xxx.YourTest"         # 只跑某个测试类
gradlew test --tests "com.xxx.YourTest.method1" # 只跑某个方法
```

### 2.6 常用命令行参数（记这几个就够）

```bash
gradlew build -x test                 # 排除测试任务（等价于 assemble，但其他 check 仍跑）
gradlew build --offline               # 离线模式，只用本地缓存，不联网
gradlew build --info                  # 详细日志，排查报错
gradlew build --debug                 # debug 级日志，疑难杂症
gradlew build --parallel              # 多模块并行构建，加速
gradlew build --refresh-dependencies  # 强制刷新依赖缓存
gradlew clean --refresh-dependencies  # 清 build + 刷依赖缓存，缓存作妖时救命
```

> `-x` 是"排除任务"。`-x test` 只跳过测试；想连代码检查一起跳，用 `-x check`。

### 2.7 多模块项目实操

假设有 `module-a`、`module-b`，且 `module-b` 依赖 `module-a`：

```bash
gradlew :module-a:build                # 只构建 module-a
gradlew :module-a:publishToMavenLocal  # 只把 module-a 发本地
gradlew clean build                    # 一次性构建全部模块
```

> 冒号前缀 `:模块名:任务名`，IDEA 面板点任务时会自动带。

---

## 三、在 IDEA 里怎么用 Gradle

IDEA 对 Gradle 的支持已经很成熟，绝大多数操作不用敲命令行，点面板就行。

### 3.1 Gradle 面板在哪

右侧边栏 → **Gradle** 图标，点开就是任务树。结构大致是：

- `build` 组：clean / classes / jar / assemble / build / buildNeeded / buildDependents
- `publishing` 组：publishToMavenLocal 等发布任务
- `verification` 组：test / check
- `documentation` 组：javadoc
- `help` 组：dependencies / projects / properties

### 3.2 三种执行方式

1. **直接点**：展开任务树，双击或右键 `Run`。
2. **存成配置**：右键任务 → `Create Run/Debug Configuration`，以后一键运行，还能加 `-x test` 之类的参数。
3. **终端敲**：底部 Terminal 里 `./gradlew 任务名`，推荐用 wrapper。

### 3.3 几个 IDEA 实操坑点

- `publishToMavenLocal` 之后，**刷新一下 Maven 面板**（或重新 import），IDEA 才能识别本地新装的 jar。
- 改了 `build.gradle` 之后，IDEA 通常会自动提示 "Load Gradle Changes"；如果是老版本，手动点工具栏的刷新按钮。
- 优先用项目自带 `gradlew`，别用本机全局 Gradle，原因前面说过了。

### 3.4 常见场景对照

| 场景 | 做法 |
| --- | --- |
| 改完代码想快速打 jar，不跑测试 | `clean assemble -x test` |
| 本地把 SDK 推给别的工程引用 | `clean build publishToMavenLocal` |
| jar 包冲突、版本不对 | `dependencies` / `dependencyInsight --dependency xxx` |
| 各种奇怪报错，怀疑缓存 | `clean --refresh-dependencies` |

---

## 四、Gradle vs Maven：到底差在哪

这部分原文没展开，这里补上。**先给结论：不是谁取代谁，而是看场景。**

### 4.1 核心差异一览

| 维度 | Gradle | Maven |
| --- | --- | --- |
| 构建脚本 | **Groovy / Kotlin DSL**（`build.gradle` / `build.gradle.kts`），是代码 | **XML**（`pom.xml`），是声明式配置 |
| 构建模型 | 基于任务（Task）依赖图，灵活 | 基于生命周期（Lifecycle）阶段，固定 |
| 性能 | **增量构建 + 构建缓存 + 守护进程 + 并行**，二次构建通常快很多 | 每次基本全量，相对慢 |
| 灵活性 | 高，可以写逻辑、动态配置 | 低，约定优于配置，定制要靠插件 |
| 学习曲线 | 偏陡（要懂 DSL 和 Task 模型） | 平缓（XML 看就懂） |
| 生态成熟度 | 较新，插件增长快 | 老牌，插件/资料极多 |
| 多模块 | 支持好，configuration-on-demand 只配置需要的模块 | 支持，但大项目配置较啰嗦 |
| 依赖管理 | 解析能力强，支持动态版本、`dependencyInsight` | 稳定，依赖调解规则清晰 |
| 默认脚手架 | Spring Boot、Android 默认 Gradle | 大量传统企业项目 |

### 4.2 几个关键点的展开

**1）构建脚本：代码 vs 配置**

Maven 的 `pom.xml` 是纯声明，你告诉它"我要什么"，它按固定生命周期执行。好处是规范、可读、换人就能接手；坏处是稍微非常规的需求（按环境改依赖、条件打包）就要写插件或者用 profile 凑。

Gradle 的 `build.gradle` 是真正的程序。你可以在里面写 `if`、`for`、定义函数、动态生成任务。灵活度拉满，但也意味着新人容易写出一堆看不懂的脚本。

**2）性能：这是 Gradle 的杀手锏**

Gradle 有三板斧：

- **增量构建**：只重新编译改动的文件，没动的跳过；
- **构建缓存**：任务输出可缓存，换机器/换分支也能复用；
- **守护进程（Daemon）**：常驻 JVM，免去每次启动开销；
- **并行 / 配置按需**：多模块项目能显著提速。

大型项目里，Gradle 的二次构建常常比 Maven 快数倍。Maven 也在推增量（如 `maven-incremental`），但整体还是偏全量。

**3）依赖冲突排查**

Gradle 自带 `dependencyInsight`，能直接告诉你某个 jar 为什么是现在这个版本、被谁强制锁定。Maven 要用 `mvn dependency:tree`，信息够用但不如 Gradle 顺手。两者都能解决冲突，只是 Gradle 的体验更现代。

**4）发布到 Maven 仓库**

这点两者殊途同归：Gradle 用 `maven-publish` 插件，Maven 用 `deploy` 阶段，最终产物都是 jar + pom，都能发到本地 `.m2` 和远程私服。库作者用哪个构建，消费方都不受影响。

### 4.3 怎么选

- **新项目 / 微服务 / Android / 想快**：选 **Gradle**。Spring Boot 官方 init 默认就是它。
- **传统企业项目 / 团队不熟悉 Gradle / 强规范强约束**：**Maven** 依然稳，资料多、坑少、招人成本低。
- **维护老项目**：别折腾迁移，继续用原来的。构建工具迁移收益通常小于风险。

> 现实里很多公司是两个并存：应用用 Gradle，内部基础库为了和老 Maven 生态对齐也可能继续 Maven。消费方无感，所以不必非黑即白。

---

## 五、进阶玩法（高级用法）

把 Gradle 当"构建工具"用只会 `build` 和 `clean`；把它当"编程框架"用，才能吃到它真正的红利。下面挑几个性价比最高、也是面试/实战常被问到的进阶点。

### 5.1 自定义 Task：把重复劳动自动化

Gradle 的 Task 是真对象，你可以直接在 `build.gradle` 里写自己的构建步骤。比如每次构建完自动把 jar 复制到一个发布目录：

```groovy
// build.gradle（Groovy DSL）
task copyJar(type: Copy) {
    from jar               // 依赖 jar 任务，先打后拷
    into "${rootProject.rootDir}/dist"
    dependsOn jar
}
```

Kotlin DSL 写法（`build.gradle.kts`）：

```kotlin
tasks.register<Copy>("copyJar") {
    from(tasks.jar)
    into("${rootProject.rootDir}/dist")
}
```

关键点：**task 之间通过 `dependsOn` / 输入输出形成依赖图**，Gradle 会据此决定执行顺序和是否跳过。

### 5.2 增量构建：让自定义 Task 也能"秒过"

Gradle 自带的 `compileJava` 之所以快，是因为它声明了"输入是什么、输出是什么"，没变就跳过。你写的 Task 也能享受这套机制——只要标注 `@Input` / `@OutputFile`：

```groovy
class GenTask extends DefaultTask {
    @Input  String content
    @OutputFile File outputFile

    @TaskAction
    void generate() {
        outputFile.text = content
    }
}
```

这样当 `content` 和 `outputFile` 都没变时，Gradle 直接标记 `UP-TO-DATE` 跳过执行。**性能优化不是靠缓存运气，而是靠把"什么是变更"告诉构建系统。**

### 5.3 构建缓存（Build Cache）：跨机器复用产物

Gradle 有两层缓存：

- **本地缓存**：默认开启，任务输出存到 `~/.gradle/caches`。
- **远程缓存**：团队/CI 共享，把别人的构建产物直接拉来用，CI 上收益巨大。

开启远程缓存（需要自建或购买 Gradle Enterprise / Develocity）：

```properties
# gradle.properties
org.gradle.caching=true
org.gradle.cache.remote.url=https://cache.example.com
```

搭配上一节的增量构建，大项目 CI 时长经常能砍掉一半以上。

### 5.4 Configuration Cache：再砍一刀配置开销

Gradle 启动后要"配置"一遍所有 `build.gradle`（求值阶段），这一步在超大项目上也不便宜。**Configuration Cache** 把这阶段的结果序列化缓存，下次直接复用：

```properties
# gradle.properties
org.gradle.configuration-cache=true
```

目前（Gradle 8.x）已是稳定特性，但对插件兼容性有要求——少数老插件还不支持，遇到报错先排查插件。

### 5.5 抽取公共配置：buildSrc / Convention Plugin

多模块项目里，每个模块的 `build.gradle` 都在重复 `java`、`test`、`dependencies` 配置。**别复制粘贴，抽成 convention plugin**：

```kotlin
// buildSrc/src/main/kotlin/my.java-library.gradle.kts
plugins {
    `java-library`
}
dependencies {
    testImplementation("junit:junit:4.13.2")
}
```

然后在子模块里：

```kotlin
// module-a/build.gradle.kts
plugins {
    id("my.java-library")
}
```

`buildSrc` 会在构建前被自动编译并注入，既共享又类型安全。现代做法是直接用 `includeBuild("gradle/plugins")` 的 precompiled script plugin，效果类似但更灵活。

### 5.6 依赖管理进阶：锁定、约束、强制

**依赖锁定（Dependency Locking）**——固定动态版本，避免哪天远程升了个不兼容版本把你 CI 搞挂：

```bash
gradlew dependencies --write-locks   # 把当前解析结果锁进 lock 文件
```

**依赖约束（Constraints）**——在不直接引入时，统一约束某个 transitive 依赖的版本：

```groovy
dependencies {
    constraints {
        implementation('com.google.guava:guava:32.1.3-jre') {
            because '安全修复，强制统一版本'
        }
    }
}
```

**排除传递依赖 / 强制版本**：

```groovy
implementation('org.apache.httpcomponents:httpclient:4.5.14') {
    exclude group: 'commons-logging', module: 'commons-logging'
}
configurations.all {
    resolutionStrategy {
        force 'com.fasterxml.jackson.core:jackson-databind:2.15.3'
    }
}
```

### 5.7 多环境与敏感配置：gradle.properties + init script

**项目级 `gradle.properties`**（提交到仓库，放非敏感配置）：

```properties
version=1.0.0
org.gradle.parallel=true
```

**用户级 `~/.gradle/gradle.properties`**（不提交，放仓库地址、账号、开关）：

```properties
mavenRepoUrl=https://nexus.internal.com/repository/releases
mavenRepoUser=ci
mavenRepoPass=******
```

**`init.gradle`（init script）**——放在 `~/.gradle/` 或项目根，对所有构建统一注入配置（比如公司私服、统一插件仓库），不用每个项目改一遍。适合团队统一治理。

### 5.8 在线诊断：Build Scan（--scan）

构建一跑，加个 `--scan`，Gradle 会把任务耗时、依赖解析、缓存命中、失败栈全部上传到 `scans.gradle.com`，生成一份可视化报告，发给同事一起排障特别方便：

```bash
gradlew build --scan
```

本地排查性能瓶颈、CI 超时，这基本是标配手段。

### 5.9 发布高级：签名、胖 jar、Spring Boot jar

**签名（signing 插件）**——发到中央仓库通常需要 GPG 签名：

```groovy
plugins { id 'signing' }
signing {
    sign publishing.publications.mavenJava
}
```

**胖 jar（把所有依赖打进一个 jar）**——用 `shadow` 插件，避免运行时缺包：

```groovy
plugins { id 'com.github.johnrengelman.shadow' version '8.1.1' }
shadowJar { archiveClassifier.set('all') }
```

**Spring Boot 项目**本身是 `bootJar`（可执行 jar，内嵌依赖），和普通的 `jar` 是两套产物，别混淆——`build` 时两者都会生成，部署用 `bootJar`。

### 5.10 性能开关速查

```properties
# gradle.properties —— 常用组合
org.gradle.caching=true            # 构建缓存
org.gradle.parallel=true           # 多模块并行
org.gradle.configuration-cache=true # 配置缓存（需插件兼容）
org.gradle.jvmargs=-Xmx2g          # 给 daemon 更多内存
```

> CI 上建议加 `--no-daemon`（CI 是一次性进程，常驻 daemon 没意义），本地开发则相反，靠 daemon 提速。

---

## 六、常用 Gradle 文件结构速览

光会敲命令，看不懂项目里那一堆 `*.gradle` 文件也白搭。这一节把最常见的几个文件逐一拆开：**哪个是干嘛的、写什么、放哪、要不要提交仓库**。

### 6.1 先看一棵典型项目树

**单模块：**

```
my-app/
├── build.gradle          # 构建脚本（核心）
├── settings.gradle       # 项目名 + 仓库统管
├── gradle.properties     # 项目属性 + 性能开关
├── gradlew / gradlew.bat # wrapper，入口脚本
└── gradle/
    └── wrapper/
        └── gradle-wrapper.properties  # 锁 Gradle 版本
```

**多模块：**

```
my-app/
├── settings.gradle       # include 'module-a', 'module-b'
├── build.gradle          # 根项目脚本（subprojects/allprojects 统一配置）
├── config.gradle         # 自定义共享配置（非内置，见 6.6）
├── gradle/
│   ├── wrapper/gradle-wrapper.properties
│   └── libs.versions.toml  # 依赖版本目录（现代写法，见 6.7）
├── module-a/
│   └── build.gradle
└── module-b/
    └── build.gradle
```

### 6.2 `settings.gradle` —— 项目的"总开关"

它不是用来写构建逻辑的，而是**定义项目本身**：叫什么名字、包含哪些模块、插件和依赖去哪找。

```groovy
// settings.gradle（Groovy DSL）
rootProject.name = 'my-app'

// 声明多模块；子目录带冒号层级，如 'module-b:sub-c'
include 'module-a', 'module-b'

// 插件从哪下载（替代在 build.gradle 里逐个配）
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

// 依赖仓库统管：开启后，子模块不能再各自写 repositories（强制统一）
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
        // maven { url 'https://maven.aliyun.com/repository/public' }  // 国内镜像
    }
}
```

> 经验：把 `repositories` 统一收到 `settings.gradle` 里，能避免"这个模块能拉到依赖、那个拉不到"的混乱。

### 6.3 `build.gradle` —— 真正的构建脚本

这是最核心、你也最常改的文件。它分几个标准区块，记住这几个就够读懂大多数项目：

```groovy
// build.gradle（Java Library 示例，Groovy DSL）
plugins {
    id 'java-library'
    id 'maven-publish'
}

group = 'com.example'
version = '1.0.0'

repositories {
    mavenCentral()
}

dependencies {
    api      'org.apache.commons:commons-lang3:3.14.0'  // 对外暴露（传递依赖）
    implementation 'com.google.guava:guava:32.1.3-jre'  // 仅内部用，不泄漏给调用方
    testImplementation 'junit:junit:4.13.2'             // 仅测试用
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

tasks.named('test') {
    useJUnit()
    testLogging { events 'passed', 'skipped', 'failed' }
}

publishing {
    publications {
        mavenJava(MavenPublication) {
            from components.java
        }
    }
    repositories { mavenLocal() }
}
```

**几个关键区块：**

- **`plugins`**：声明要用哪些插件（`java-library`、`maven-publish` 等）。Kotlin DSL 里写成 `plugins { id("java-library") }`。
- **`repositories`**：依赖从哪里下载。现代项目一般挪到 `settings.gradle`（见 6.2），这里可以省略。
- **`dependencies`**：核心。`implementation` 和 `api` 的区别很重要——`api` 会把依赖**传递**给调用你库的人，`implementation` 只在自己内部可见。能写 `implementation` 就别写 `api`，减少依赖泄漏。
- **`configurations` / `tasks`**：自定义配置和任务（进阶玩法 5.1、5.2 讲过）。
- **`publishing`**：发布配置（对应前面 publishing 组任务）。

> DSL 有两种：`build.gradle`（Groovy）和 `build.gradle.kts`（Kotlin）。同一套语义，写法略有差异。新项目推荐 Kotlin DSL，类型安全、IDE 补全更好。

### 6.4 `gradle.properties` —— 属性与性能开关

纯键值对，不打代码。两层：

- **项目级** `./gradle.properties`（提交仓库）：放非敏感的项目配置。
- **用户级** `~/.gradle/gradle.properties`（不提交）：放仓库地址、账号、全局开关。

```properties
# 项目级 gradle.properties
version=1.0.0
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.jvmargs=-Xmx2g

# 用户级（不提交）—— 敏感信息放这
mavenRepoUser=ci
mavenRepoPass=******
```

前面进阶章节（5.7、5.10）提到的所有性能开关，其实都是写在这个文件里。

### 6.5 `gradle-wrapper.properties` —— 锁定 Gradle 版本

它就是前面反复强调的 `gradlew` 背后的配置文件，决定了大家用**哪个版本**的 Gradle：

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

升级 Gradle 版本就改 `distributionUrl`，或者一行命令让 wrapper 自己改：

```bash
gradlew wrapper --gradle-version 8.7
```

> 这就是"为什么要用 gradlew 而不是全局 gradle"的答案：版本写死在仓库里，全队一致。

### 6.6 `config.gradle` —— 注意，它不是 Gradle 内置文件

这是个容易踩坑的点：**`config.gradle` 不是 Gradle 官方文件**，而是很多老项目（尤其早期 Android / 多模块 Java）约定俗成的一个"共享配置脚本"。它的存在完全靠 `apply from:` 手动引入。

```groovy
// config.gradle（自定义，放项目根目录）
ext {
    compileSdk = 17
    libraries = [
        guava: 'com.google.guava:guava:32.1.3-jre',
        junit: 'junit:junit:4.13.2'
    ]
}
```

子模块里引入并复用：

```groovy
// module-a/build.gradle
apply from: rootProject.file('config.gradle')

dependencies {
    implementation libraries.guava
}
```

⚠️ 因为 `config.gradle` 是"约定"而非"机制"，它没有类型安全、IDE 补全差、改名容易漏。**现代项目更推荐用下面的 Version Catalog 或 buildSrc 来替代它**（进阶章节 5.5 讲过 buildSrc）。

### 6.7 `gradle/libs.versions.toml` —— 现代依赖集中管理（Version Catalog）

Gradle 7.4+ 原生支持的"依赖版本目录"，是取代 `config.gradle` 那套 `ext` 写法的官方方案。把所有版本和坐标集中到一个 TOML：

```toml
# gradle/libs.versions.toml
[versions]
guava = "32.1.3-jre"
junit = "4.13.2"

[libraries]
guava = { module = "com.google.guava:guava", version.ref = "guava" }
junit = { module = "junit:junit", version.ref = "junit" }

[bundles]
test = ["junit"]

[plugins]
```

在 `build.gradle.kts` 里就能类型安全地引用：

```kotlin
dependencies {
    implementation(libs.guava)      // 对应 [libraries].guava
    testImplementation(libs.junit)
}
```

好处：版本一处改、全局生效；IDE 能补全；支持 `bundles` 把一组依赖打包引用。**新项目默认就用它**，老项目迁移成本也不高。

### 6.8 `init.gradle` —— 全局/团队统一配置（Init Script）

放在 `~/.gradle/init.gradle`（用户级）或项目根 `init.gradle`，对**所有**构建生效，常用于团队统一私服、统一插件仓库，不用每个项目改一遍：

```groovy
// ~/.gradle/init.gradle
allprojects {
    repositories {
        mavenLocal()
        mavenCentral()
    }
}
```

> 和 `config.gradle` 的区别：`init.gradle` 是 Gradle 官方机制（Init Script），在构建最早期执行；`config.gradle` 是普通脚本靠 `apply from` 引入。想做"组织级强制配置"优先用 `init.gradle` 或 settings 里的 `pluginManagement` / `dependencyResolutionManagement`。

### 6.9 一张表记全

| 文件 | 作用 | 作用范围 | 是否提交仓库 |
| --- | --- | --- | --- |
| `settings.gradle[.kts]` | 项目名、模块清单、插件/依赖仓库统管 | 项目根 | ✅ 是 |
| `build.gradle[.kts]` | 具体模块的构建脚本（依赖、任务、发布） | 每个模块 | ✅ 是 |
| `gradle.properties` | 项目属性 + 性能开关 | 项目级 / 用户级 | 项目级是，用户级否 |
| `gradle-wrapper.properties` | 锁定 Gradle 版本（`distributionUrl`） | 项目 | ✅ 是 |
| `config.gradle` | **自定义**共享配置（`apply from` 引入，非内置） | 自定义 | ✅ 是（若使用） |
| `gradle/libs.versions.toml` | 依赖版本目录（现代集中管理） | 项目 | ✅ 是 |
| `init.gradle` | 全局/团队统一配置（Init Script） | 用户级或项目级 | 视放置位置 |

---

## 七、速查卡片（收藏用）

```bash
# 完整构建（跑测试）
gradlew build

# 打包不跑测试
gradlew assemble

# 清缓存 + 完整构建 + 发本地仓库
gradlew clean build publishToMavenLocal

# 只跑某个测试
gradlew test --tests "com.xxx.YourTest"

# 查依赖冲突
gradlew dependencies
gradlew dependencyInsight --dependency guava

# 缓存作妖
gradlew clean --refresh-dependencies

# 多模块只构建某一个
gradlew :module-a:build
```

---

## 八、小结

- **日常**：`build` / `assemble` / `clean` / `publishToMavenLocal` 四个任务覆盖 80% 场景。
- **排错**：`dependencies` + `dependencyInsight` 是 jar 冲突的标配组合。
- **IDEA**：右侧 Gradle 面板双击即跑，存成 Run Configuration 更香；发本地后记得刷新。
- **选型**：Gradle 赢在快和灵活，Maven 赢在稳和易懂。新项目无脑 Gradle，老项目别动，二者可并存。
