export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer
      id="contact"
      className="py-20 px-6"
      style={{
        background: 'rgba(5, 5, 10, 0.95)',
        borderTop: '1px solid rgba(0, 245, 255, 0.1)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        <div>
          <h3
            className="font-orbitron text-2xl font-black mb-4"
            style={{
              background: 'linear-gradient(135deg, #00f5ff, #b829dd, #ff2d95)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            &lt;JENSEN/&gt;
          </h3>
          <p className="text-text-secondary text-sm leading-7">
            AI Agent 架构师 | 5 年企业级 AI 应用研发经验
            <br />
            精通 RAG、MCP、A2A 等智能体核心协议
            <br />
            致力于构建企业级多智能体协作系统
          </p>
        </div>

        <div>
          <h4 className="text-neon-blue font-bold mb-4 text-sm tracking-widest">
            快速链接
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <a href="/#about" className="hover:neon-text-blue">
                关于我
              </a>
            </li>
            <li>
              <a href="/#skills" className="hover:neon-text-blue">
                技术栈
              </a>
            </li>
            <li>
              <a href="/#projects" className="hover:neon-text-blue">
                项目
              </a>
            </li>
            <li>
              <a href="/blog" className="hover:neon-text-blue">
                博客
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-neon-purple font-bold mb-4 text-sm tracking-widest">
            联系方式
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>📧 jensenlyz@163.com</li>
            <li>📱 13384459987</li>
            <li>📍 长沙</li>
            <li className="pt-2">
              <a
                href="https://github.com/lyzsniper"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:neon-text-blue"
              >
                🐙 github.com/lyzsniper
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="text-center text-text-secondary text-sm pt-6"
        style={{ borderTop: '1px solid rgba(0, 245, 255, 0.1)' }}
      >
        <p>
          Designed & Built by{' '}
          <span className="neon-text-blue">Jensen</span> | AI Agent 架构师 | ©{' '}
          {year}
        </p>
      </div>
    </footer>
  )
}
