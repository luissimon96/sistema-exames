'use client'

export default function TestimonialsSection() {
  const testimonials = [
    {
      content:
        "O ExamAnalyzer transformou a maneira como entendo meus exames. Antes eu ficava perdido com tantos números e termos técnicos, agora tenho explicações claras e simples.",
      author: {
        name: 'Carlos Silva',
        role: 'Engenheiro',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    },
    {
      content:
        "Como médica, recomendo o ExamAnalyzer para todos os meus pacientes. A plataforma ajuda a melhorar a comunicação e o entendimento dos resultados, tornando as consultas muito mais produtivas.",
      author: {
        name: 'Dra. Mariana Costa',
        role: 'Clínica Geral',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    },
    {
      content:
        "Tenho diabetes e preciso monitorar constantemente meus exames. O ExamAnalyzer me ajuda a entender as tendências e me alerta quando algo está fora do normal. É como ter um assistente médico pessoal.",
      author: {
        name: 'Roberto Almeida',
        role: 'Aposentado',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    },
  ]

  return (
    <div id="testimonials" className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Depoimentos</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            O que nossos usuários dizem
          </p>
          <p className="mt-5 max-w-prose mx-auto text-xl text-gray-500">
            Milhares de pessoas já transformaram a maneira como entendem seus exames médicos com o ExamAnalyzer.
          </p>
        </div>
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="flex flex-col bg-gray-50 rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600">Depoimento</p>
                    <div className="mt-2">
                      <p className="text-gray-500 text-base italic">&ldquo;{testimonial.content}&rdquo;</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {testimonial.author.name.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{testimonial.author.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.author.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
