"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Plus, GripVertical, Trash2, Eye, Monitor, Smartphone, Type, Grid3X3, Code, Space, Megaphone, Upload, Save, Sparkles, Tag, Play
} from "lucide-react";
import { getAdminHomepage, updateAdminHomepage, type HomepageConfig } from "@/app/services/homepage";
import { listAdminArticles, type Article, uploadArticleContentImage, listCategories, type Category } from "@/app/services/articles";
import type { Section, HeroSection, FeaturedGridSection, FeaturedCarouselSection, HtmlSection, SpacerSection, CtaSection, CategoryGridSection } from "@/app/services/homepage";
import Link from 'next/link';
import { toAbsoluteImageUrl } from "@/app/lib/api";
import { IframePreview } from "@/app/components/homepage/IframePreview";
import { SectionTemplates, type SectionTemplate } from "@/app/components/homepage/SectionTemplates";
import { CodeEditor } from "@/app/components/homepage/CodeEditor";

const SECTION_ICONS = { hero: Type, featuredGrid: Grid3X3, featuredCarousel: Play, categoryGrid: Tag, html: Code, spacer: Space, cta: Megaphone } as const;
const SECTION_LABELS = { hero: "Section Hero", featuredGrid: "Grille d'Articles", featuredCarousel: "Carrousel d'Articles", categoryGrid: "Grille de Catégories", html: "Contenu HTML", spacer: "Espacement", cta: "Appel à l'Action" } as const;

export default function HomepageBuilderPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('all');

  const cfgQ = useQuery({
    queryKey: ["admin-homepage"],
    queryFn: getAdminHomepage,
    select: (res: { success: boolean; data: HomepageConfig }) => res.data,
  });

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    select: (res: { success: boolean; data: Category[] }) => res.data,
  });

  const [search, setSearch] = useState("");
  const articlesQ = useQuery({
    queryKey: ["admin-articles", { page: 1, limit: 100, search }],
    queryFn: () => listAdminArticles({ page: 1, limit: 100, search: search || undefined }),
    select: (res: { success: boolean; data: Article[]; pagination: any }) => res.data,
  });

  const [form, setForm] = useState<HomepageConfig>({ featuredArticleIds: [], sections: [] });
  useEffect(() => {
    if (cfgQ.data) setForm({ ...cfgQ.data, featuredArticleIds: cfgQ.data.featuredArticleIds || [], sections: cfgQ.data.sections || [] });
  }, [cfgQ.data]);

  const mSave = useMutation({
    mutationFn: (payload: Partial<HomepageConfig>) => updateAdminHomepage(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-homepage"] }); },
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const allArticles = articlesQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const addSection = (kind: Section["kind"]) => {
    const defaults: Record<Section["kind"], Section> = {
      hero: { kind: "hero", title: "Bienvenue sur notre blog", subtitle: "Découvrez nos derniers articles", imageUrl: null } as HeroSection,
      featuredGrid: { kind: "featuredGrid", title: "Articles à la une", articleIds: [] } as FeaturedGridSection,
      featuredCarousel: { kind: "featuredCarousel", title: "Articles en vedette", articleIds: [], transition: "slide", speed: 5000, autoPlay: true } as FeaturedCarouselSection,
      categoryGrid: { kind: "categoryGrid", title: "Catégories", categoryIds: [] } as CategoryGridSection,
      html: { kind: "html", html: "<div class='text-center p-8'><h3>Contenu personnalisé</h3></div>" } as HtmlSection,
      spacer: { kind: "spacer", size: "md" } as SpacerSection,
      cta: { kind: "cta", title: "Rejoignez-nous", text: "Inscrivez-vous", buttonLabel: "S'inscrire", buttonHref: "/newsletter" } as CtaSection,
    };
    setForm((f) => ({ ...f, sections: [...(f.sections || []), defaults[kind]] }));
  };

  const addSectionFromTemplate = (template: SectionTemplate) => {
    setForm((f) => ({ ...f, sections: [...(f.sections || []), template.section] }));
    setShowTemplates(false);
  };

  const removeSection = (idx: number) => setForm((f) => ({ ...f, sections: (f.sections || []).filter((_, i) => i !== idx) }));
  const updateSection = (idx: number, changes: Partial<Section>) =>
    setForm((f) => ({ ...f, sections: (f.sections || []).map((s, i) => (i === idx ? { ...s, ...changes } as Section : s)) }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setForm((f) => {
        const sections = f.sections || [];
        const oldIndex = sections.findIndex((_, i) => i.toString() === active.id);
        const newIndex = sections.findIndex((_, i) => i.toString() === over.id);
        return { ...f, sections: arrayMove(sections, oldIndex, newIndex) };
      });
    }
  };

  const onUploadHero = async (file: File, idx?: number) => {
    const res = await uploadArticleContentImage(file);
    if (idx != null) updateSection(idx, { imageUrl: res.data.url } as Partial<HeroSection>);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold truncate">Constructeur de Page d'Accueil</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 hidden sm:block">Interface professionnelle intuitive</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button onClick={() => setActiveTab("builder")} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md ${activeTab === "builder" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-gray-600 dark:text-slate-300"}`}>
                  Constructeur
                </button>
                <button onClick={() => setActiveTab("preview")} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md ${activeTab === "preview" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-gray-600 dark:text-slate-300"}`}>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />Aperçu
                </button>
              </div>

              <div className="flex justify-between sm:justify-start gap-2 sm:gap-4">
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  <button onClick={() => setDevice("desktop")} className={`p-2 rounded-md ${device === "desktop" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-gray-600 dark:text-slate-300"}`}>
                    <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button onClick={() => setDevice("mobile")} className={`p-2 rounded-md ${device === "mobile" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-gray-600 dark:text-slate-300"}`}>
                    <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <button onClick={() => mSave.mutate({ sections: form.sections || [] })} disabled={mSave.isPending}
                  className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap">
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />{mSave.isPending ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {activeTab === "builder" ? (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Enhanced Palette */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 lg:sticky lg:top-24">
                {/* Header with Template Toggle */}
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-semibold">Ajouter une Section</h3>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                        showTemplates 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {showTemplates ? 'Templates' : 'Rapide'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {showTemplates ? 'Choisissez un template prêt à l\'emploi' : 'Créez des sections personnalisées'}
                  </p>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {showTemplates ? (
                    <SectionTemplates 
                      onSelectTemplate={addSectionFromTemplate}
                      activeCategory={templateCategory}
                      onCategoryChange={setTemplateCategory}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {(Object.keys(SECTION_ICONS) as Array<keyof typeof SECTION_ICONS>).map((kind) => {
                        const Icon = SECTION_ICONS[kind];
                        return (
                          <button key={kind} onClick={() => addSection(kind)}
                            className="w-full flex items-center space-x-2 sm:space-x-3 p-3 border rounded-xl border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex-shrink-0">
                              <Icon className="w-5 h-5 text-gray-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                                {SECTION_LABELS[kind]}
                              </p>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {(form.sections || []).length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-12 text-center">
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-slate-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Commencez à construire</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mb-4 sm:mb-6">Ajoutez votre première section</p>
                  <button onClick={() => addSection("hero")} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base">
                    <Plus className="w-4 h-4 mr-2" />Ajouter Hero
                  </button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={(form.sections || []).map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 sm:space-y-4">
                      {(form.sections || []).map((section, idx) => (
                        <SortableSectionCard key={idx} id={idx.toString()} section={section} index={idx}
                          onUpdate={updateSection} onRemove={removeSection} allArticles={allArticles}
                          categories={categories} onUploadHero={onUploadHero} search={search} setSearch={setSearch} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full max-w-6xl">
              <IframePreview 
                config={form}
                articles={allArticles}
                categories={categories}
                device={device}
              />
            </div>
          </div>
        )}
      </div>

      {mSave.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          ✓ Sauvegardé avec succès
        </div>
      )}
    </div>
  );
}

function SortableSectionCard({ id, section, index, onUpdate, onRemove, allArticles, categories, onUploadHero, search, setSearch }: {
  id: string; section: Section; index: number;
  onUpdate: (idx: number, changes: Partial<Section>) => void;
  onRemove: (idx: number) => void;
  allArticles: Article[];
  categories: Category[];
  onUploadHero: (file: File, idx?: number) => Promise<void>;
  search: string; setSearch: (search: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const Icon = SECTION_ICONS[section.kind];
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="w-5 h-5 text-gray-400 dark:text-slate-400" />
          </div>
          <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Icon className="w-4 h-4 text-gray-600 dark:text-slate-300" />
          </div>
          <div>
            <h4 className="font-medium">{SECTION_LABELS[section.kind]}</h4>
            <p className="text-sm text-gray-500 dark:text-slate-400">Section {index + 1}</p>
          </div>
        </div>
        <button onClick={() => onRemove(index)} className="p-2 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">
        {renderAdvancedSectionEditor(section, index, onUpdate, allArticles, onUploadHero, search, setSearch, categories)}
      </div>
    </div>
  );
}

function renderSectionPreview(s: Section, allArticles: Article[], categories: Category[]) {
  if (s.kind === "hero") {
    const sh = s as HeroSection;
    return (
      <div className="relative overflow-hidden rounded-lg h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        {sh.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={toAbsoluteImageUrl(sh.imageUrl)} alt="Hero" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            {sh.title && <h3 className="text-lg font-bold mb-1">{sh.title}</h3>}
            {sh.subtitle && <p className="text-sm opacity-90">{sh.subtitle}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Removed stray categoryGrid editor UI from preview; correct preview remains below.

  if (s.kind === "featuredGrid") {
    const sg = s as FeaturedGridSection;
    const map = new Map(allArticles.map((a) => [a.id, a] as const));
    const selected = (sg.articleIds || []).map((id) => map.get(id)).filter(Boolean) as Article[];
    return (
      <div>
        {sg.title && <h3 className="font-semibold mb-3">{sg.title}</h3>}
        <div className="grid grid-cols-3 gap-2">
          {selected.slice(0, 3).map((a) => (
            <div key={a.id} className="border rounded p-2 text-xs">
              <div className="w-full h-16 bg-gray-200 rounded mb-1"></div>
              <p className="font-medium truncate">{a.title}</p>
            </div>
          ))}
          {selected.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 py-4">
              Aucun article sélectionné
            </div>
          )}
        </div>
      </div>
    );
  }

  if (s.kind === "categoryGrid") {
    const sc = s as CategoryGridSection;
    const selected = (sc.categoryIds || [])
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean) as Category[];
    const colors = [
      "bg-blue-600",
      "bg-emerald-600",
      "bg-purple-600",
      "bg-rose-600",
      "bg-amber-600",
      "bg-cyan-600",
    ];
    return (
      <div>
        {sc.title && <h3 className="font-semibold mb-3">{sc.title}</h3>}
        <div className="flex flex-wrap gap-2">
          {selected.map((c, i) => (
            <span
              key={c.id}
              className={`inline-flex items-center px-3 py-1 rounded-full text-white text-xs ${colors[i % colors.length]}`}
            >
              {c.name}
            </span>
          ))}
          {selected.length === 0 && (
            <div className="text-center text-gray-500 py-4 w-full">Aucune catégorie sélectionnée</div>
          )}
        </div>
      </div>
    );
  }

  if (s.kind === "html") {
    const sh = s as HtmlSection;
    return (
      <div className="border rounded p-4 bg-gray-50 dark:bg-slate-700/50">
        <div className="flex items-center mb-2">
          <Code className="w-4 h-4 mr-2 text-gray-600" />
          <span className="text-sm font-medium">Contenu HTML personnalisé</span>
        </div>
        <div className="text-xs text-gray-500 font-mono bg-white dark:bg-slate-800 p-2 rounded max-h-20 overflow-hidden">
          {sh.html.substring(0, 100)}...
        </div>
      </div>
    );
  }

  if (s.kind === "spacer") {
    const size = (s as SpacerSection).size;
    const label = size === "sm" ? "Petit" : size === "md" ? "Moyen" : "Grand";
    const h = size === "sm" ? "h-2" : size === "md" ? "h-4" : "h-8";
    return (
      <div className="text-center">
        <div className={`${h} bg-gray-200 dark:bg-slate-600 rounded mx-auto mb-2`} style={{width: '60%'}}></div>
        <span className="text-sm text-gray-500">Espacement {label}</span>
      </div>
    );
  }

  if (s.kind === "cta") {
    const sc = s as CtaSection;
    return (
      <div className="border rounded-lg p-4 text-center bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-semibold mb-2">{sc.title}</h3>
        {sc.text && <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{sc.text}</p>}
        {sc.buttonLabel && (
          <div className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">
            {sc.buttonLabel}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function renderAdvancedSectionEditor(s: Section, idx: number, update: (idx: number, changes: Partial<Section>) => void, 
  allArticles: Article[], onUploadHero: (file: File, idx?: number) => Promise<void>, search: string, setSearch: (search: string) => void, categories: Category[]) {
  
  if (s.kind === "hero") {
    const sh = s as HeroSection;
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Titre principal</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all" 
            value={sh.title || ""} 
            onChange={(e) => update(idx, { title: e.target.value } as Partial<HeroSection>)}
            placeholder="Entrez le titre principal..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Sous-titre</label>
          <textarea 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all resize-none" 
            rows={3}
            value={sh.subtitle || ""} 
            onChange={(e) => update(idx, { subtitle: e.target.value } as Partial<HeroSection>)}
            placeholder="Ajoutez un sous-titre descriptif..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Image de fond</label>
          <div className="space-y-3">
            <input 
              type="url" 
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
              value={sh.imageUrl || ""} 
              onChange={(e) => update(idx, { imageUrl: e.target.value } as Partial<HeroSection>)}
              placeholder="https://exemple.com/image.jpg"
            />
            <div className="text-center">
              <span className="text-sm text-slate-500">ou</span>
            </div>
            <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
              <Upload className="w-5 h-5 mr-2 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Télécharger une image</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && onUploadHero(e.target.files[0], idx)} />
            </label>
          </div>
          {sh.imageUrl && (
            <div className="mt-3">
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={toAbsoluteImageUrl(sh.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => update(idx, { imageUrl: null } as Partial<HeroSection>)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (s.kind === "featuredGrid") {
    const sg = s as FeaturedGridSection;
    const map = new Map(allArticles.map((a) => [a.id, a] as const));
    const selected = (sg.articleIds || []).map((id) => map.get(id)).filter(Boolean) as Article[];
    const add = (id: string) => !sg.articleIds.includes(id) && update(idx, { articleIds: [...sg.articleIds, id] } as Partial<FeaturedGridSection>);
    const remove = (id: string) => update(idx, { articleIds: sg.articleIds.filter((x) => x !== id) } as Partial<FeaturedGridSection>);

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Titre de la section</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
            value={sg.title || ""} 
            onChange={(e) => update(idx, { title: e.target.value } as Partial<FeaturedGridSection>)}
            placeholder="Articles à la une"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Sélection d'articles</label>
          <input 
            type="text" 
            placeholder="Rechercher des articles..." 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all mb-4"
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          
          {selected.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Articles sélectionnés ({selected.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selected.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">{a.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.isPublished ? "Publié" : "Brouillon"}</p>
                    </div>
                    <button 
                      onClick={() => remove(a.id)} 
                      className="ml-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-600 rounded-xl p-3">
            {allArticles
              .filter((a) => !selected.some((s) => s.id === a.id) && (!search || a.title.toLowerCase().includes(search.toLowerCase())))
              .map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.isPublished ? "Publié" : "Brouillon"}</p>
                  </div>
                  <button 
                    onClick={() => add(a.id)} 
                    className="ml-3 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            {allArticles.filter((a) => !selected.some((s) => s.id === a.id) && (!search || a.title.toLowerCase().includes(search.toLowerCase()))).length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Grid3X3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun article disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (s.kind === "featuredCarousel") {
    const sc = s as FeaturedCarouselSection;
    const map = new Map(allArticles.map((a) => [a.id, a] as const));
    const selected = (sc.articleIds || []).map((id) => map.get(id)).filter(Boolean) as Article[];
    const add = (id: string) => !sc.articleIds.includes(id) && update(idx, { articleIds: [...sc.articleIds, id] } as Partial<FeaturedCarouselSection>);
    const remove = (id: string) => update(idx, { articleIds: sc.articleIds.filter((x) => x !== id) } as Partial<FeaturedCarouselSection>);

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Titre du carousel</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
            value={sc.title || ""} 
            onChange={(e) => update(idx, { title: e.target.value } as Partial<FeaturedCarouselSection>)}
            placeholder="Articles en vedette"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Sélection d'articles</label>
          <input 
            type="text" 
            placeholder="Rechercher des articles..." 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all mb-4"
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          
          {selected.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Articles sélectionnés ({selected.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selected.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">{a.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.isPublished ? "Publié" : "Brouillon"}</p>
                    </div>
                    <button 
                      onClick={() => remove(a.id)} 
                      className="ml-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-600 rounded-xl p-3">
            {allArticles
              .filter((a) => !selected.some((s) => s.id === a.id) && (!search || a.title.toLowerCase().includes(search.toLowerCase())))
              .map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.isPublished ? "Publié" : "Brouillon"}</p>
                  </div>
                  <button 
                    onClick={() => add(a.id)} 
                    className="ml-3 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            {allArticles.filter((a) => !selected.some((s) => s.id === a.id) && (!search || a.title.toLowerCase().includes(search.toLowerCase()))).length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun article disponible</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Transition</label>
            <select
              value={sc.transition || "slide"}
              onChange={(e) => update(idx, { transition: e.target.value as 'slide' | 'fade' | 'zoom' } as Partial<FeaturedCarouselSection>)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="slide">Glissement (Slide)</option>
              <option value="fade">Fondu (Fade)</option>
              <option value="zoom">Zoom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Vitesse (ms)</label>
            <input
              type="number"
              min="1000"
              max="10000"
              step="500"
              value={sc.speed || 5000}
              onChange={(e) => update(idx, { speed: Number(e.target.value) } as Partial<FeaturedCarouselSection>)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Lecture automatique</label>
            <div className="flex items-center h-[52px]">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sc.autoPlay ?? true}
                  onChange={(e) => update(idx, { autoPlay: e.target.checked } as Partial<FeaturedCarouselSection>)}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                />
                <span className="ml-3 text-sm text-slate-700 dark:text-slate-300">Activer</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Conseil :</strong> Le carousel affichera les articles avec leur couverture en arrière-plan, le titre et le résumé (si disponible). 
            Sélectionnez au moins 3 articles pour un meilleur effet visuel.
          </p>
        </div>
      </div>
    );
  }

  if (s.kind === "categoryGrid") {
    const sc = s as CategoryGridSection;
    const selected = (sc.categoryIds || [])
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean) as Category[];
    const add = (id: string) =>
      !sc.categoryIds.includes(id) &&
      update(idx, { categoryIds: [...sc.categoryIds, id] } as Partial<CategoryGridSection>);
    const remove = (id: string) =>
      update(idx, { categoryIds: sc.categoryIds.filter((x) => x !== id) } as Partial<CategoryGridSection>);

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Titre de la section</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
            value={sc.title || ""}
            onChange={(e) => update(idx, { title: e.target.value } as Partial<CategoryGridSection>)}
            placeholder="Catégories"
          />
        </div>

        {selected.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Catégories sélectionnées ({selected.length})</p>
            <div className="flex flex-wrap gap-2">
              {selected.map((c) => (
                <span key={c.id} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-xs">
                  {c.name}
                  <button
                    onClick={() => remove(c.id)}
                    className="ml-2 text-white/90 hover:text-white"
                    aria-label={`Retirer ${c.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Ajouter des catégories</label>
          <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-600 rounded-xl p-3">
            {categories
              .filter((c) => !sc.categoryIds.includes(c.id))
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg transition-colors">
                  <span className="text-sm">{c.name}</span>
                  <button
                    onClick={() => add(c.id)}
                    className="ml-3 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            {categories.filter((c) => !sc.categoryIds.includes(c.id)).length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune autre catégorie disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (s.kind === "html") {
    const sh = s as HtmlSection;
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Contenu HTML personnalisé</label>
          <CodeEditor
            value={sh.html}
            onChange={(value) => update(idx, { html: value } as Partial<HtmlSection>)}
            language="html"
            placeholder="<div class='text-center p-8'>
  <h3 class='text-2xl font-bold mb-4'>Votre contenu ici</h3>
  <p>Ajoutez votre HTML personnalisé...</p>
</div>"
            height="h-80"
          />
        </div>
      </div>
    );
  }

  if (s.kind === "spacer") {
    const ss = s as SpacerSection;
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Taille de l'espacement</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'sm', label: 'Petit', height: 'h-4' },
              { value: 'md', label: 'Moyen', height: 'h-8' },
              { value: 'lg', label: 'Grand', height: 'h-16' }
            ].map((size) => (
              <button
                key={size.value}
                onClick={() => update(idx, { size: size.value as SpacerSection["size"] })}
                className={`p-4 border-2 rounded-xl transition-all ${
                  ss.size === size.value 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                }`}
              >
                <div className={`${size.height} bg-slate-300 dark:bg-slate-600 rounded mx-auto mb-2`}></div>
                <span className="text-sm font-medium">{size.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (s.kind === "cta") {
    const sc = s as CtaSection;
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Titre</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
            value={sc.title} 
            onChange={(e) => update(idx, { title: e.target.value } as Partial<CtaSection>)}
            placeholder="Rejoignez notre communauté"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Description</label>
          <textarea 
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all resize-none" 
            rows={4}
            value={sc.text || ""} 
            onChange={(e) => update(idx, { text: e.target.value } as Partial<CtaSection>)}
            placeholder="Ajoutez une description convaincante..."
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Texte du bouton</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
              value={sc.buttonLabel || ""} 
              onChange={(e) => update(idx, { buttonLabel: e.target.value } as Partial<CtaSection>)}
              placeholder="S'inscrire"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Lien du bouton</label>
            <input 
              type="url" 
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
              value={sc.buttonHref || ""} 
              onChange={(e) => update(idx, { buttonHref: e.target.value } as Partial<CtaSection>)}
              placeholder="/newsletter"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
