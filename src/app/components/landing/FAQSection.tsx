'use client'

import { useState } from 'react'
import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "Como o ExamAnalyzer funciona?",
    answer:
      "O ExamAnalyzer utiliza inteligência artificial para analisar seus exames médicos em PDF. Basta fazer upload dos seus exames, e nossa plataforma extrairá os dados, analisará os resultados e fornecerá explicações claras e simples sobre cada parâmetro.",
  },
  {
    question: "Meus dados médicos estão seguros?",
    answer:
      "Sim, a segurança dos seus dados é nossa prioridade. Utilizamos criptografia de ponta a ponta e seguimos rigorosos protocolos de segurança. Seus dados são armazenados de forma segura e nunca são compartilhados com terceiros sem sua autorização explícita.",
  },
  {
    question: "Quais tipos de exames o sistema consegue analisar?",
    answer:
      "Atualmente, o ExamAnalyzer pode analisar a maioria dos exames laboratoriais comuns, incluindo hemograma completo, perfil lipídico, glicemia, função hepática, função renal, hormônios e muitos outros. Estamos constantemente expandindo nossa capacidade de análise para incluir novos tipos de exames.",
  },
  {
    question: "O ExamAnalyzer substitui a consulta médica?",
    answer:
      "Não. O ExamAnalyzer é uma ferramenta complementar que ajuda você a entender melhor seus exames, mas não substitui a avaliação e o diagnóstico de um profissional de saúde. Sempre consulte seu médico para interpretação definitiva dos seus resultados e recomendações de tratamento.",
  },
  {
    question: "Posso compartilhar meus resultados com meu médico?",
    answer:
      "Sim, o ExamAnalyzer permite que você compartilhe seus resultados e análises com seus médicos de forma segura. Você pode gerar um link seguro ou um PDF com os resultados analisados para compartilhar durante suas consultas.",
  },
  {
    question: "Como faço para cancelar minha assinatura?",
    answer:
      "Você pode cancelar sua assinatura a qualquer momento através da página de configurações da sua conta. Após o cancelamento, você continuará tendo acesso aos recursos do seu plano até o final do período de faturamento atual.",
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function FAQSection() {
  return (
    <div id="faq" className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Perguntas Frequentes
          </h2>
          <dl className="mt-6 space-y-6 divide-y divide-gray-200">
            {faqs.map((faq) => (
              <Disclosure as="div" key={faq.question} className="pt-6">
                {({ open }) => (
                  <>
                    <dt className="text-lg">
                      <Disclosure.Button className="text-left w-full flex justify-between items-start text-gray-400">
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        <span className="ml-6 h-7 flex items-center">
                          <ChevronDownIcon
                            className={classNames(open ? '-rotate-180' : 'rotate-0', 'h-6 w-6 transform')}
                            aria-hidden="true"
                          />
                        </span>
                      </Disclosure.Button>
                    </dt>
                    <Disclosure.Panel as="dd" className="mt-2 pr-12">
                      <p className="text-base text-gray-500">{faq.answer}</p>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
