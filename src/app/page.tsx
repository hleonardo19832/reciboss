'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  FileText, CheckCircle, Download, Shield, Zap, Users,
  ArrowRight, Star, ChevronRight, Menu, X
} from 'lucide-react'

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/6 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255,255,255) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">ReciboFácil</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">Funcionalidades</a>
            <a href="#how" className="text-slate-400 hover:text-white transition-colors text-sm">Como funciona</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Preços</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors text-sm px-4 py-2">
              Entrar
            </Link>
            <Link href="/auth/register" className="bg-brand-500 hover:bg-brand-400 text-white text-sm px-5 py-2 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-brand-500/25">
              Começar grátis
            </Link>
          </div>

          <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-white/5 px-6 py-4 flex flex-col gap-4">
            <a href="#features" className="text-slate-400 text-sm" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
            <a href="#how" className="text-slate-400 text-sm" onClick={() => setMenuOpen(false)}>Como funciona</a>
            <Link href="/auth/login" className="text-slate-400 text-sm">Entrar</Link>
            <Link href="/auth/register" className="bg-brand-500 text-white text-sm px-5 py-2.5 rounded-xl font-medium text-center">
              Começar grátis
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium px-4 py-2 rounded-full mb-8 animate-fade-in">
            <Star className="w-3 h-3 fill-current" />
            100% Gratuito · Sem cartão de crédito
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] mb-6 animate-fade-up">
            Recibos profissionais{' '}
            <span className="text-brand-400">em segundos</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animate-delay-100">
            Crie, gerencie e envie recibos profissionais com facilidade.
            Seus clientes, seus dados, total controle.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-200">
            <Link
              href="/auth/register"
              className="group flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:shadow-2xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 text-slate-400 hover:text-white px-8 py-4 rounded-2xl font-medium text-base transition-colors border border-white/10 hover:border-white/20"
            >
              Já tenho conta
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mock Receipt Preview */}
          <div className="mt-20 relative animate-fade-up animate-delay-300">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" style={{ top: '60%' }} />
            <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 max-w-2xl mx-auto overflow-hidden border border-white/10">
              {/* Receipt header */}
              <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Minha Empresa Ltda.</div>
                    <div className="text-slate-400 text-xs">CNPJ: 12.345.678/0001-90</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-brand-400 font-mono text-xs font-bold">REC-2024-48291</div>
                  <div className="text-slate-500 text-xs mt-0.5">07/05/2024</div>
                </div>
              </div>
              <div className="px-8 py-6 text-left">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Recebido de</div>
                    <div className="text-slate-900 font-semibold">João Silva</div>
                    <div className="text-slate-500 text-sm">joao@exemplo.com.br</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Status</div>
                    <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">✓ Pago</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 mb-4">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Serviços</div>
                  <div className="flex justify-between text-sm text-slate-700 mb-2">
                    <span>Desenvolvimento de site</span>
                    <span className="font-medium">R$ 3.500,00</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-700">
                    <span>Manutenção mensal</span>
                    <span className="font-medium">R$ 500,00</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Total</span>
                  <span className="text-2xl font-bold text-slate-900">R$ 4.000,00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Ferramentas poderosas para gerenciar seus recibos de forma simples e profissional.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Criação instantânea',
                description: 'Gere recibos profissionais em menos de 1 minuto com nosso formulário intuitivo.',
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
              },
              {
                icon: Download,
                title: 'Download em PDF',
                description: 'Baixe seus recibos em PDF de alta qualidade, prontos para impressão ou envio por email.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Shield,
                title: 'Dados seguros',
                description: 'Cada usuário acessa apenas seus próprios dados. Segurança e privacidade garantidas.',
                color: 'text-brand-400',
                bg: 'bg-brand-500/10',
              },
              {
                icon: Users,
                title: 'Gestão de clientes',
                description: 'Cadastre seus clientes uma vez e use em todos os recibos. Histórico completo.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: CheckCircle,
                title: 'Múltiplos status',
                description: 'Acompanhe recibos pagos, pendentes e cancelados em um painel visual e organizado.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: FileText,
                title: 'Numeração automática',
                description: 'Numeração sequencial automática para manter seu controle financeiro organizado.',
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-brand-500/30 hover:bg-slate-900 transition-all group"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-32">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Como funciona
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crie sua conta', desc: 'Cadastre-se gratuitamente em menos de 1 minuto. Sem cartão de crédito.' },
              { step: '02', title: 'Configure seu perfil', desc: 'Adicione os dados da sua empresa para personalizar seus recibos.' },
              { step: '03', title: 'Emita seus recibos', desc: 'Crie recibos profissionais e baixe em PDF instantaneamente.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-6xl font-bold text-brand-500/20 mb-4">{item.step}</div>
                <h3 className="text-white font-semibold text-xl mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Simples e gratuito
          </h2>
          <p className="text-slate-400 text-lg mb-12">
            Sem taxas, sem limites. Use à vontade.
          </p>
          <div className="bg-gradient-to-br from-brand-500/20 to-emerald-500/10 border border-brand-500/30 rounded-3xl p-10">
            <div className="text-6xl font-bold text-white mb-2 font-display">R$ 0</div>
            <div className="text-brand-400 text-lg mb-8">Para sempre</div>
            <ul className="text-left space-y-3 mb-10 max-w-xs mx-auto">
              {[
                'Recibos ilimitados',
                'Clientes ilimitados',
                'Download em PDF',
                'Painel de controle completo',
                'Dados 100% seguros',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-10 py-4 rounded-2xl font-semibold text-base transition-all hover:shadow-2xl hover:shadow-brand-500/30"
            >
              Começar agora — é grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white">ReciboFácil</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} ReciboFácil. Feito com ♥ no Brasil.
          </p>
        </div>
      </footer>
    </div>
  )
}
