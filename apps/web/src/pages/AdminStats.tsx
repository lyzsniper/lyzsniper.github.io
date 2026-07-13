import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  Eye,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { api, type StatsOverview, type TrendPoint } from '@/lib/api'
import SvgLineChart from '@/components/SvgLineChart'

type Tab = 'overview' | 'posts' | 'sources' | '404s'

export default function AdminStats() {
  const { t } = useTranslation(['common', 'adminstats'])
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [trendDays, setTrendDays] = useState(30)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [posts, setPosts] = useState<{ slug: string; pv: number; title: string }[]>([])
  const [referrers, setReferrers] = useState<{ referrer: string; cnt: number }[]>([])
  const [notFounds, setNotFounds] = useState<{ path: string; cnt: number }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, tr, p, r, nf] = await Promise.all([
        api.statsOverview(),
        api.statsTrend(trendDays),
        api.statsPosts(20),
        api.statsReferrers(10),
        api.stats404s(20),
      ])
      setOverview(ov)
      setTrend(tr.data)
      setPosts(p.data)
      setReferrers(r.data)
      setNotFounds(nf.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common:error'))
    } finally {
      setLoading(false)
    }
  }, [trendDays, t])

  useEffect(() => {
    void load()
  }, [load])

  const tabs: { id: Tab; label: string; icon: typeof Eye }[] = [
    { id: 'overview', label: t('adminstats:tabs.overview') ?? '总览', icon: TrendingUp },
    { id: 'posts', label: t('adminstats:tabs.posts') ?? '热门文章', icon: FileText },
    { id: 'sources', label: t('adminstats:tabs.sources') ?? '访问来源', icon: Users },
    { id: '404s', label: t('adminstats:tabs.404s') ?? '404', icon: AlertTriangle },
  ]

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="eyebrow mb-2 flex items-center gap-1.5">
            <BarChart3 size={12} className="text-[var(--accent)]" />
            {t('adminstats:eyebrow') ?? 'Statistics'}
          </div>
          <h1 className="text-display-lg text-[var(--fg-primary)]">
            {t('adminstats:title') ?? '数据统计'}
          </h1>
          <p className="text-sm text-[var(--fg-secondary)] mt-2">
            {t('adminstats:subtitle') ?? '博客 PV / UV / 热门内容 / 404 监控'}
          </p>
        </div>
        <button onClick={() => void load()} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} /> {t('common:refresh') ?? '刷新'}
        </button>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-md text-sm mb-6"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            color: '#dc2626',
            border: '1px solid rgba(220, 38, 38, 0.16)',
          }}
        >
          {error}
        </div>
      )}

      {/* tabs */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
        {tabs.map((tb) => {
          const Icon = tb.icon
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 transition -mb-[1px] ${
                tab === tb.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]'
              }`}
            >
              <Icon size={14} />
              {tb.label}
            </button>
          )
        })}
      </div>

      {loading && (
        <p className="text-sm text-[var(--fg-tertiary)] py-12 text-center">{t('common:loading')}</p>
      )}

      {!loading && overview && tab === 'overview' && (
        <>
          {/* KPI 卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <KpiCard
              label={t('adminstats:kpi.todayPv') ?? '今日 PV'}
              value={overview.todayPv}
              icon={<Eye size={14} />}
              sub={t('adminstats:kpi.todayUv', { n: overview.todayUv }) ?? `UV ${overview.todayUv}`}
            />
            <KpiCard
              label={t('adminstats:kpi.last7Pv') ?? '近 7 日 PV'}
              value={overview.last7Pv}
              icon={<TrendingUp size={14} />}
              sub={t('adminstats:kpi.last7Uv', { n: overview.last7Uv }) ?? `UV ${overview.last7Uv}`}
            />
            <KpiCard
              label={t('adminstats:kpi.last30Pv') ?? '近 30 日 PV'}
              value={overview.last30Pv}
              icon={<TrendingUp size={14} />}
              sub={t('adminstats:kpi.last30Uv', { n: overview.last30Uv }) ?? `UV ${overview.last30Uv}`}
            />
            <KpiCard
              label={t('adminstats:kpi.totalPv') ?? '历史总 PV'}
              value={overview.totalPv}
              icon={<Eye size={14} />}
              sub={t('adminstats:kpi.totalUv', { n: overview.totalUv }) ?? `UV ${overview.totalUv}`}
            />
            <KpiCard
              label={t('adminstats:kpi.404') ?? '404 总数'}
              value={overview.notFoundTotal}
              icon={<AlertTriangle size={14} />}
              accentColor="rgb(239, 68, 68)"
            />
          </div>

          {/* 趋势图 */}
          <div className="surface-card p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--fg-primary)] flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[var(--accent)]" />
                {t('adminstats:trend.title') ?? 'PV / UV 趋势'}
              </h2>
              <div className="flex gap-1">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTrendDays(d)}
                    className={`h-7 px-2.5 text-xs rounded-md transition ${
                      trendDays === d
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    {t(`adminstats:trend.${d}d`) ?? `${d} 天`}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs text-[var(--fg-tertiary)] mb-2 uppercase tracking-wider">PV</h3>
                <SvgLineChart
                  data={trend.map((p) => ({ label: p.day.slice(5), value: p.pv }))}
                  color="#4f46e5"
                />
              </div>
              <div>
                <h3 className="text-xs text-[var(--fg-tertiary)] mb-2 uppercase tracking-wider">UV</h3>
                <SvgLineChart
                  data={trend.map((p) => ({ label: p.day.slice(5), value: p.uv }))}
                  color="#06b6d4"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && tab === 'posts' && (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="px-4 py-3 text-left text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">
                  {t('adminstats:table.title') ?? '文章'}
                </th>
                <th className="px-4 py-3 text-right text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">
                  PV
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p, i) => (
                <tr key={p.slug} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2.5 text-xs text-[var(--fg-tertiary)] font-mono">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/blog/${p.slug}`}
                      className="text-[var(--fg-primary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--fg-primary)]">
                    {p.pv.toLocaleString()}
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--fg-tertiary)]">
                    {t('adminstats:noData') ?? '暂无数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'sources' && (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="px-4 py-3 text-left text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">
                  {t('adminstats:table.referrer') ?? '来源'}
                </th>
                <th className="px-4 py-3 text-right text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">
                  {t('adminstats:table.visits') ?? '访问数'}
                </th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((r, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2.5">
                    {r.referrer.startsWith('http') ? (
                      <a
                        href={r.referrer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--fg-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
                      >
                        {truncate(r.referrer, 50)}
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-[var(--fg-secondary)]">{r.referrer}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--fg-primary)]">
                    {r.cnt.toLocaleString()}
                  </td>
                </tr>
              ))}
              {referrers.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-[var(--fg-tertiary)]">
                    {t('adminstats:noData') ?? '暂无数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === '404s' && (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="px-4 py-3 text-left text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">
                  {t('adminstats:table.path') ?? '路径'}
                </th>
                <th className="px-4 py-3 text-right text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">
                  #
                </th>
              </tr>
            </thead>
            <tbody>
              {notFounds.map((n, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--fg-secondary)]">{n.path}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-red-500">
                    {n.cnt.toLocaleString()}
                  </td>
                </tr>
              ))}
              {notFounds.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-[var(--fg-tertiary)] flex flex-col items-center">
                    <Eye size={20} className="mb-1 text-green-500" />
                    {t('adminstats:no404') ?? '暂无 404'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accentColor = 'var(--accent)',
}: {
  label: string
  value: number
  sub?: string
  icon: React.ReactNode
  accentColor?: string
}) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs text-[var(--fg-tertiary)] mb-2 flex items-center gap-1.5">
        <span style={{ color: accentColor }}>{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums text-[var(--fg-primary)]">
        {value.toLocaleString()}
      </div>
      {sub && <div className="text-xs text-[var(--fg-tertiary)] mt-1">{sub}</div>}
    </div>
  )
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}
