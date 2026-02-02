## **Plano de Reestruturação e Aprimoramento do Sistema**

### **1. Camada de Dados e Backend (PocketBase)**
- **Atualização do Schema**: Modificar [setup_schema.js](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/scripts/setup_schema.js) para incluir os campos `issue_date`, `due_date`, `payment_date`, `delay_days` e `exact_payment_timestamp` na coleção de contas.
- **Coleção de Auditoria**: Criar a coleção `audit_logs` para registrar quem alterou o quê, quando e o motivo.

### **2. Modelo de Dados e Lógica**
- **TypeScript**: Atualizar [types.ts](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/types.ts) com os novos campos e status de pagamento.
- **Service Layer**: Implementar funções para cálculo automático de `delay_days`, validação de datas (emissão vs pagamento) e prevenção de pagamentos duplicados.

### **3. Interface e Alertas**
- **UI**: Atualizar [AddBillModal.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/components/AddBillModal.tsx) para coleta de datas e [ReportsView.tsx](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/views/ReportsView.tsx) para filtros avançados.
- **Alertas**: Implementar indicadores visuais para contas vencidas há 1, 7 e 30 dias no Dashboard.

### **4. Testes Unitários**
- **Cobertura**: Criar testes unitários para os cenários de pagamento:
    - Pontual (payment_date = due_date)
    - Atrasado (payment_date > due_date)
    - Antecipado (payment_date < due_date)
    - Parcial (com validação de valor e status)
