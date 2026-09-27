import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, LampDesk, PaintRoller, PencilRuler, Sofa, Sparkles } from "lucide-react";
import { InteriorProjectBrief } from "@/components/interiors/project-brief";
import { LightingPreview } from "@/components/interiors/lighting-preview";

const SERVICES = [
  {
    id: "design", number: "01", title: "Design", icon: PencilRuler,
    introduction: "A clear direction for the way you want to live.",
    description: "Start with the room, the people who use it and what needs to change. Explore layouts, colour, materials and lighting as parts of the same idea.",
    details: ["Space planning and room layouts", "Colour and material direction", "Furniture and lighting concepts"],
  },
  {
    id: "renovate", number: "02", title: "Renovate", icon: PaintRoller,
    introduction: "Make more of the space you already have.",
    description: "Discuss a room refresh or a wider refurbishment. From a kitchen or bathroom to an entire property, define the changes and agree the work before it begins.",
    details: ["Existing-property upgrades", "Kitchen and bathroom ideas", "Painting, decorating and flooring"],
  },
  {
    id: "furnish", number: "03", title: "Furnish", icon: Sofa,
    introduction: "Give an empty space a sense of home.",
    description: "Consider the pieces that make a room work together. Plan furniture, fabrics and accessories around the layout, your priorities and the budget you have in mind.",
    details: ["New and empty-home planning", "Furniture selection and placement", "Materials, textiles and sourcing"],
  },
  {
    id: "finish", number: "04", title: "Finish", icon: Sparkles,
    introduction: "Bring the details into focus.",
    description: "Explore the finishing touches that connect a space: texture, colour, décor and styling. For a home you live in or one you are preparing to let or sell.",
    details: ["Décor and accessories", "Styling and final details", "Presentation for living or viewings"],
  },
];

const PROCESS = [
  ["Consult", "Tell us about your property, the rooms you have in mind and what you want to achieve."],
  ["Design", "Explore a direction for the layout, materials, furniture and lighting."],
  ["Plan the work", "Agree the scope, responsibilities and quote, including any separate trades or installation."],
  ["Finish", "Bring the agreed details together and review the result against your brief."],
];

export default function RenovationsPage() {
  return (
    <div className="bg-white text-estate-700">
      <section className="border-b border-estate-700/10 px-4 pb-12 pt-12 sm:pb-16 md:px-6 md:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-estate-700/65">Interiors &amp; Renovations</p>
            <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              A space that<br />feels like <span className="italic">you.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-estate-700/75 sm:text-lg sm:leading-8">
              A room to refresh. An empty home to furnish. A property ready for a new chapter.
              Start with your idea, and explore a considered way forward with Haus.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#project-brief" className="inline-flex min-h-12 items-center gap-4 rounded-full bg-estate-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-estate-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700">
                Start with your space <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
              <a href="#services" className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-medium underline-offset-4 hover:underline">
                Explore the possibilities <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-t-[7rem] border border-estate-700/15 bg-[#f0f1eb] px-6 pb-7 pt-10 sm:rounded-t-[10rem] sm:px-10 sm:pt-12">
            <div aria-hidden="true" className="mx-auto aspect-[1.15] max-w-md">
              <svg viewBox="0 0 460 400" className="size-full" fill="none">
                <path d="M62 341V88L230 28L398 88V341H62Z" stroke="#244735" strokeWidth="1.5" />
                <path d="M62 341L230 270L398 341M230 28V270M62 88L230 157L398 88" stroke="#244735" strokeOpacity=".22" />
                <path d="M96 112L194 152V257L96 298V112Z" fill="#d6ddcf" stroke="#244735" strokeWidth="1.5" />
                <path d="M145 132V277M96 205L194 204" stroke="#244735" strokeOpacity=".55" />
                <path d="M271 125L359 91V207L271 240V125Z" fill="#e6dccc" stroke="#244735" strokeWidth="1.5" />
                <path d="M283 160L347 135M283 187L347 162" stroke="#244735" strokeOpacity=".3" />
                <path d="M112 313L222 267L348 319L232 369L112 313Z" fill="#d1bfa5" fillOpacity=".45" />
                <path d="M167 280V237C167 230 171 226 178 229L260 262C267 265 270 269 270 277V317L167 280Z" fill="#244735" />
                <path d="M147 279V263C147 256 152 253 158 256L263 298L293 286V304L263 318L147 279Z" fill="#50705b" stroke="#244735" strokeWidth="1.5" />
                <path d="M157 282V298M262 319V335M291 307V318" stroke="#244735" strokeWidth="3" />
                <ellipse cx="308" cy="278" rx="31" ry="12" fill="#f9f7f2" stroke="#244735" strokeWidth="1.5" />
                <path d="M308 290V322" stroke="#244735" strokeWidth="2" />
                <path d="M352 252V189M336 252H368" stroke="#244735" strokeWidth="2" />
                <path d="M331 190L341 158H363L375 190H331Z" fill="#f9f7f2" stroke="#244735" strokeWidth="1.5" />
                <path d="M99 339H151M309 355H373" stroke="#244735" strokeOpacity=".25" />
              </svg>
            </div>
            <div className="flex items-end justify-between gap-6 border-t border-estate-700/15 pt-5">
              <p className="font-serif text-2xl leading-tight">Good spaces begin<br /><span className="italic">with a conversation.</span></p>
              <span className="max-w-20 text-right text-[10px] uppercase leading-4 tracking-widest text-estate-700/60">An illustrative room concept</span>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Interiors page sections" className="border-b border-estate-700/10 bg-white px-4 md:px-6">
        <div className="mx-auto flex max-w-7xl gap-x-6 overflow-x-auto py-1 sm:gap-x-10">
          {[["#project-brief", "Your space"], ["#services", "Our approach"], ["#lighting-design", "Lighting design"], ["#process", "The process"]].map(([href, label]) => (
            <a key={href} href={href} className="inline-flex min-h-12 shrink-0 items-center text-xs font-semibold uppercase tracking-widest text-estate-700/75 underline-offset-8 hover:text-estate-700 hover:underline">{label}</a>
          ))}
        </div>
      </nav>

      <section id="project-brief" className="scroll-mt-28 bg-[#f7f7f2] px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-estate-700/60">Begin where you are</p>
            <h2 className="mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl">What do you have in mind?</h2>
            <p className="mt-4 text-base leading-7 text-estate-700/75">Choose a starting point. You don’t need a finished brief, or every detail decided.</p>
          </div>
          <InteriorProjectBrief />
        </div>
      </section>

      <section id="services" className="scroll-mt-28 px-4 py-14 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-5 md:grid-cols-2 md:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-estate-700/60">From the first idea to the final detail</p><h2 className="mt-4 max-w-lg font-serif text-3xl font-medium leading-tight sm:text-4xl">One room or a whole new direction.</h2></div>
            <p className="max-w-lg text-base leading-7 text-estate-700/75 md:justify-self-end">Explore design on its own, or discuss how it connects with refurbishment, furnishing and the finishing touches. The scope is shaped around your project.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-estate-700/15 bg-estate-700/15 md:grid-cols-2">
            {SERVICES.map(({ id, number, title, icon: Icon, introduction, description, details }) => (
              <article id={id} key={id} className="scroll-mt-28 bg-white p-6 sm:p-9 lg:p-10">
                <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-estate-700/50">{number}</span><Icon className="size-6 text-estate-700/70" strokeWidth={1.4} aria-hidden="true" /></div>
                <h3 className="mt-7 font-serif text-4xl font-medium">{title}</h3>
                <p className="mt-4 text-lg font-medium leading-7">{introduction}</p>
                <p className="mt-3 max-w-lg text-sm leading-7 text-estate-700/75">{description}</p>
                <ul className="mt-6 space-y-3 border-t border-estate-700/10 pt-6">
                  {details.map(detail => <li key={detail} className="flex items-start gap-3 text-sm leading-6"><Check className="mt-1 size-4 shrink-0 text-estate-700/60" aria-hidden="true" /><span>{detail}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-6 text-estate-700/65">Design, furniture, materials and installation can involve different scopes. We’ll discuss what you need and what is included before you decide to go ahead.</p>
        </div>
      </section>

      <section id="lighting-design" className="scroll-mt-28 bg-estate-700 px-4 py-14 text-white md:px-6 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <LampDesk className="size-7 text-white/65" strokeWidth={1.3} aria-hidden="true" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Lighting design</p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-tight sm:text-5xl">The same room.<br /><span className="italic">A different feeling.</span></h2>
            <p className="mt-6 max-w-md text-base leading-7 text-white/80">Light shapes how a room feels and how it works. Explore ambient light for the whole space, task lighting where you need it, and accents that draw attention to a detail.</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/65">Discuss placement, layers and fittings as part of your interior design. Electrical wiring and installation are a separate part of the work.</p>
            <Link href="/maintenance" className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white">Explore electrical maintenance <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <LightingPreview />
        </div>
      </section>

      <section id="process" className="scroll-mt-28 px-4 py-14 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-estate-700/60">A considered process</p><h2 className="mt-4 font-serif text-3xl font-medium sm:text-4xl">Your idea, with a way forward.</h2></div>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {PROCESS.map(([title, body], index) => <li key={title} className="border-t border-estate-700/20 pt-5"><p className="text-xs tracking-widest text-estate-700/50">0{index + 1}</p><h3 className="mt-5 font-serif text-2xl font-medium">{title}</h3><p className="mt-3 text-sm leading-7 text-estate-700/75">{body}</p></li>)}
          </ol>
          <div className="mt-12 flex flex-col gap-4 rounded-xl bg-[#f0f1eb] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div><h3 className="font-serif text-2xl font-medium">Repairs rather than a redesign?</h3><p className="mt-2 text-sm leading-6 text-estate-700/75">For plumbing and electrical work, start with Maintenance.</p></div>
            <Link href="/maintenance" className="inline-flex min-h-11 shrink-0 items-center gap-3 text-sm font-semibold underline underline-offset-4">Explore Maintenance <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="border-t border-estate-700/10 bg-[#f7f7f2] px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-estate-700/60">Let’s start with a conversation</p><h2 className="mt-4 font-serif text-3xl font-medium sm:text-4xl">Tell us about your space.</h2><p className="mt-3 max-w-lg text-sm leading-7 text-estate-700/75">Share the goal, the room and anything you already have in mind.</p></div>
          <a href="#project-brief" className="inline-flex min-h-12 shrink-0 items-center gap-5 rounded-full bg-estate-700 px-6 py-3 text-sm font-semibold text-white hover:bg-estate-600">Start your project brief <ArrowUpRight className="size-4" aria-hidden="true" /></a>
        </div>
      </section>
    </div>
  );
}
