import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { BUDGET_TEMPLATES } from '@/lib/constants';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  theme: 'light' | 'dark';
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  theme
}) => {
  if (!isOpen) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: 'spring', damping: 25 }}
          className={`max-w-4xl w-full rounded-xl shadow-2xl overflow-hidden ${theme === 'dark'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              Choose Budget Template
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BUDGET_TEMPLATES.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(template.id)}
                  className={`p-6 rounded-xl border cursor-pointer transition-all ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    } shadow-md hover:shadow-lg`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div>
                      <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                        {template.name}
                      </h3>
                      <span className={`text-sm px-2 py-1 rounded-full ${template.category === 'feature'
                          ? 'bg-blue-100 text-blue-800'
                          : template.category === 'short'
                            ? 'bg-green-100 text-green-800'
                            : template.category === 'documentary'
                              ? 'bg-purple-100 text-purple-800'
                              : template.category === 'commercial'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-pink-100 text-pink-800'
                        }`}>
                        {template.category.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {template.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {template.budget.sections.length} sections •
                      {template.budget.sections.reduce((sum, section) =>
                        sum + section.categories.length, 0
                      )} categories
                    </div>
                    <div className="text-indigo-600 font-medium">
                      Select →
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};