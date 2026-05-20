  const exportCSV = () => {
    if (filteredReceipts.length === 0) {
      alert('Nenhum recibo para exportar com os filtros atuais.')
      return
    }

    const formatCSVNumber = (val: number) => {
      return val.toFixed(2).replace('.', ',')
    }

    const headers = ['Número do Recibo', 'Cliente', 'Data de Emissão', 'Data de Vencimento', 'Data de Pagamento', 'Método de Pagamento', 'Status', 'Valor Subtotal', 'Desconto', 'Valor Total', 'Moeda', 'Descrição']
    
    const rows = filteredReceipts.map(r => {
      return [
        r.receipt_number,
        `"${r.clients?.name || 'Sem cliente'}"`,
        formatDate(r.issue_date),
        r.due_date ? formatDate(r.due_date) : '',
        r.payment_date ? formatDate(r.payment_date) : '',
        r.payment_method || '',
        STATUS_LABELS[r.status]?.label || 'Desconhecido',
        formatCSVNumber(r.subtotal),
        formatCSVNumber(r.discount || 0),
        formatCSVNumber(r.total),
        r.currency || 'BRL',
        `"${(r.description || '').replace(/"/g, '""')}"`
      ].join(';')
    })
    
    // Adicionamos o BOM (\uFEFF) para o Excel reconhecer os acentos (UTF-8) corretamente
    const csvContent = "\uFEFF" + headers.join(';') + "\n" + rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_recibos_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
