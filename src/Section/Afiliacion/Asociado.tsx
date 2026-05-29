import { useState, useRef } from "react"
import type { IconType } from "react-icons"
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiUser, FiX } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import data from "../../data/Data.json"
import FormularioAsociadoJuridico from "../../Components/Solicitudes/Juridica/AsociadoJurica"
import FormularioAsociado from "../../Components/Solicitudes/Fisico/AsociadoFisico"

type RequisitoCampo = {
  label: string
  required?: boolean
  type?: string
}

type TarjetaClienteProps = {
  badge: string
  title: string
  buttonLabel: string
  requisitos: RequisitoCampo[]
  icon: IconType
  onOpen: () => void
  isSelected: boolean
  buttonClassName: string
  badgeClassName: string
  iconClassName: string
}

const TarjetaCliente = ({
  badge,
  title,
  buttonLabel,
  requisitos,
  icon: Icon,
  onOpen,
  isSelected,
  buttonClassName,
  badgeClassName,
  iconClassName,
}: TarjetaClienteProps) => {
  return (
    <article className={`group relative overflow-hidden rounded-[24px] border bg-white p-3.5 shadow-md sm:p-4 lg:p-5 transition-all duration-300 h-full flex flex-col
      ${isSelected ? 'border-blue-400 shadow-lg ring-2 ring-blue-200' : 'border-sky-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300'}`}>
      <div className="rounded-[20px] border border-sky-200 bg-sky-50 p-4 text-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${badgeClassName}`}>
              {badge}
            </span>
            <h2 className="mt-3 whitespace-nowrap text-[clamp(0.95rem,1.6vw,1.15rem)] font-semibold tracking-tight">{title}</h2>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 ${iconClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 sm:text-xs">Lista de requisitos</h3>
        <ul className="mt-3 flex max-h-[18rem] flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-sky-100">
          {requisitos.map((requisito) => (
            <li key={requisito.label} className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <FiCheckCircle className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-medium leading-5 text-slate-800">{requisito.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${buttonClassName}`}
        onClick={onOpen}
      >
        {isSelected ? 'Formulario abierto' : buttonLabel}
        {isSelected ? <FiX className="h-4 w-4" /> : <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
      </button>
    </article>
  )
}

const Asociado = () => {
  const [formularioSeleccionado, setFormularioSeleccionado] = useState<'fisico' | 'juridico' | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const requisitosFisicos = Object.values(data.requisitosSolicitudes.asociado ?? {}) as RequisitoCampo[]
  const requisitosJuridicos = Object.values(data.juridica?.asociado ?? {}) as RequisitoCampo[]

  const abrirFormulario = (tipo: 'fisico' | 'juridico') => {
    setFormularioSeleccionado(prev => prev === tipo ? null : tipo)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 420)
  }

  return (
    <section className="relative isolate min-h-screen bg-white px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-15">
        <motion.div
          className="overflow-hidden rounded-[32px] border border-sky-200 bg-white shadow-md"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-sky-50 p-5 sm:p-6 lg:p-8 pt-12">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              Solicitud de asociado
            </span>
            <div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.9rem]">Solicitud para ser asociado</h2>
              <p className="mt-2 text-sm text-slate-600">Ser asociado en la ASADA es formar parte de la organización comunal con derecho a participar en la toma de decisiones.</p>
            </div>

            <motion.div
              className="mt-6 grid gap-5 xl:grid-cols-2 items-stretch"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
              }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
                <TarjetaCliente
                  badge="Cliente jurídico"
                  title="Asociado para empresas"
                  buttonLabel="Llenar formulario jurídico"
                  requisitos={requisitosJuridicos}
                  icon={FiBriefcase}
                  onOpen={() => abrirFormulario('juridico')}
                  isSelected={formularioSeleccionado === 'juridico'}
                  buttonClassName="bg-blue-600 hover:bg-blue-700"
                  badgeClassName="bg-sky-100 text-blue-800 ring-1 ring-inset ring-sky-300"
                  iconClassName="text-blue-700"
                />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
                <TarjetaCliente
                  badge="Cliente físico"
                  title="Asociado para personas"
                  buttonLabel="Llenar formulario físico"
                  requisitos={requisitosFisicos}
                  icon={FiUser}
                  onOpen={() => abrirFormulario('fisico')}
                  isSelected={formularioSeleccionado === 'fisico'}
                  buttonClassName="bg-blue-600 hover:bg-blue-700"
                  badgeClassName="bg-sky-100 text-blue-800 ring-1 ring-inset ring-sky-300"
                  iconClassName="text-blue-700"
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Formulario inline */}
        <AnimatePresence>
          {formularioSeleccionado && (
            <motion.div
              ref={formRef}
              key={formularioSeleccionado}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="scroll-mt-8 overflow-hidden rounded-[32px] border border-sky-200 bg-white shadow-md"
            >
              <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-6 py-4">
                <span className="text-sm font-semibold text-blue-700 uppercase tracking-wider">
                  {formularioSeleccionado === 'fisico' ? 'Formulario — Cliente Físico' : 'Formulario — Cliente Jurídico'}
                </span>
                <button
                  onClick={() => setFormularioSeleccionado(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                  aria-label="Cerrar formulario"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                {formularioSeleccionado === 'juridico' ? (
                  <FormularioAsociadoJuridico onClose={() => setFormularioSeleccionado(null)} />
                ) : (
                  <FormularioAsociado onClose={() => setFormularioSeleccionado(null)} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default Asociado
