import React from 'react';
import { Mail, ShieldCheck, Share2, FileText, ArrowRight, LucideIcon } from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  nodesCount: number;
}

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  const templates: TemplateItem[] = [
    {
      id: 'template_email_summarizer',
      name: 'Email Summarizer',
      description: 'Trigger on incoming Gmail and generate an AI summary using Gemini.',
      category: 'AI Productivity',
      iconName: 'mail',
      nodesCount: 3,
    },
    {
      id: 'template_lead_generator',
      name: 'Lead Enrichment',
      description: 'Receive webhook payloads, extract keywords and sentiment, and log to Google Sheets.',
      category: 'Marketing',
      iconName: 'shield',
      nodesCount: 4,
    },
    {
      id: 'template_social_media',
      name: 'Social Media Creator',
      description: 'Schedule a trigger, generate a blog summary, and queue standard social draft payloads.',
      category: 'Social Media',
      iconName: 'share',
      nodesCount: 3,
    },
    {
      id: 'template_meeting_notes',
      name: 'Meeting Note Refiner',
      description: 'Pass transcript details through Gemini to format action items and email them out.',
      category: 'Collaboration',
      iconName: 'text',
      nodesCount: 3,
    },
  ];

  const getIcon = (name: string): LucideIcon => {
    switch (name) {
      case 'mail':
        return Mail;
      case 'shield':
        return ShieldCheck;
      case 'share':
        return Share2;
      case 'text':
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Quick Start Templates</h3>
          <p className="text-xs text-gray-400">Deploy a production-ready template in a single click</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {templates.map((tpl) => {
          const Icon = getIcon(tpl.iconName);
          return (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className="glass-panel border border-neutral-800 rounded-2xl p-5 shadow-lg cursor-pointer hover:border-indigo-500/50 hover:bg-neutral-900/60 hover:shadow-indigo-500/5 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-850 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 text-indigo-400 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded-md">
                    {tpl.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-indigo-400 transition-colors">
                  {tpl.name}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {tpl.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-2 border-t border-neutral-900/50">
                <span>{tpl.nodesCount} Steps</span>
                <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Use Template
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
