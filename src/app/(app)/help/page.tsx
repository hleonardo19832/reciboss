'use client'

import { HelpCircle, Image as ImageIcon, CreditCard, Send, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function HelpPage() {
  const faqs = [
    {
      icon: ImageIcon,
      title: 'Como adicionar a Logo e a Assinatura?',
      content: 'Vá até o menu de "Configurações". Lá você encontrará dois espaços para envio de imagens. Uma para a sua Logo (que aparecerá no topo do recibo) e outra para a sua Assinatura (que aparecerá no rodapé). A imagem precisa ter no máximo 2MB e de preferência com fundo transparente (PNG).'
    },
    {
      icon: CreditCard,
      title: 'Assinei um plano, o que fazer agora?',
      content: 'Sua conta é atualizada automaticamente no instante em que o pagamento for aprovado. O seu limite de recibos mensais e o número de clientes permitidos será reajustado de acordo com o plano escolhido. Você pode acompanhar seus limites diretamente pelo menu lateral ou na página de Planos.'
    },
    {
      icon: Send,
      title: 'Como envio o recibo pelo WhatsApp?',
      content: 'Ao gerar um recibo, certifique-se de que o cliente possua um número de telefone cadastrado. Clique no botão verde "Enviar no WhatsApp". Isso abrirá uma conversa já preenchida com os dados do recibo. Como o WhatsApp não permite anexar arquivos automaticamente por link, recomendamos que você clique em "Baixar PDF" primeiro, e em seguida arraste o arquivo PDF baixado para a conversa do WhatsApp.'
    },
    {
      icon: ShieldCheck,
      title: 'Por que o botão do WhatsApp fica bloqueado/cinza?',
      content: 'O botão só será liberado se o cliente selecionado no recibo tiver um telefone cadastrado no sistema. Vá no menu "Clientes", edite o cliente desejado e adicione um número de celular válido. O botão ficará verde imediatamente.'
    },
    {
      icon: CheckCircle2,
      title: 'O que é o Pagamento Rápido?',
      content: 'Se um cliente fizer o pagamento de um recibo pendente, você não precisa editar o recibo inteiro. Basta clicar no botão "Registrar Pagamento" no cabeçalho do recibo. O sistema vai perguntar o método de pagamento e atualizar o status para Pago no mesmo instante.'
    }
  ]

  return (
    <div className="animate-fade-in max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-brand-400" />
          Central de Ajuda
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Dúvidas frequentes e dicas de como utilizar o sistema
        </p>
      </div>

      <div className="grid gap-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <faq.icon className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">{faq.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {faq.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-brand-500/20 to-brand-600/5 border border-brand-500/20 rounded-2xl p-6 mt-8">
        <h3 className="text-white font-bold mb-2">Ainda precisa de ajuda?</h3>
        <p className="text-slate-400 text-sm mb-4">
          Nossa equipe de suporte está pronta para ajudar você a configurar e extrair o máximo do seu sistema de recibos.
        </p>
        <button className="bg-brand-500 hover:bg-brand-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
          Entrar em contato com suporte
        </button>
      </div>
    </div>
  )
}
