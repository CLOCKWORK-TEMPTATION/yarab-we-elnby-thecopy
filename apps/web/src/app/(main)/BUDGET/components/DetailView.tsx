import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { Budget, LineItem } from '@/lib/types';

interface DetailViewProps {
  budget: Budget;
  onUpdateLineItem: (sectionId: string, categoryCode: string, itemCode: string, field: keyof LineItem, value: string | number) => void;
  theme: 'light' | 'dark';
}

interface EditingState {
  sectionId: string;
  categoryCode: string;
  itemCode: string;
  field: keyof LineItem;
}

export const DetailView: React.FC<DetailViewProps> = ({ budget, onUpdateLineItem, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['atl', 'production', 'post', 'other']));
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return null;

    const results: Array<{ section: string; category: string; item: LineItem }> = [];
    budget.sections.forEach(section => {
      section.categories.forEach(category => {
        category.items.forEach(item => {
          if (
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            results.push({ section: section.name, category: category.name, item });
          }
        });
      });
    });
    return results;
  }, [budget, searchTerm]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const startEditing = (sectionId: string, categoryCode: string, itemCode: string, field: keyof LineItem, currentValue: string | number) => {
    setEditing({ sectionId, categoryCode, itemCode, field });
    setEditValue(currentValue.toString());
  };

  const saveEdit = () => {
    if (editing) {
      const { sectionId, categoryCode, itemCode, field } = editing;
      const value = field === 'amount' || field === 'rate' ? parseFloat(editValue) || 0 : editValue;
      onUpdateLineItem(sectionId, categoryCode, itemCode, field, value);
      setEditing(null);
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`rounded-xl shadow-lg border overflow-hidden ${theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
        }`}
    >
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white p-6">
        <h2 className="text-xl font-bold uppercase tracking-wide flex items-center gap-2">
          <div className="w-1 h-6 bg-white rounded"></div>
          Detailed Budget Breakdown
        </h2>
        <p className="text-sm text-indigo-200 mt-1">Complete line-item budget with editing capabilities</p>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search line items..."
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300'
              }`}
          />
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchTerm && filteredItems && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}
          >
            <h3 className="font-semibold mb-3">Search Results ({filteredItems.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredItems.map((result, index) => (
                <div
                  key={`${result.section}-${result.category}-${result.item.code}`}
                  className={`p-3 rounded-lg border ${theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{result.item.description}</div>
                      <div className="text-sm text-gray-500">
                        {result.section} • {result.category} • {result.item.code}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(result.item.total)}</div>
                      <div className="text-sm text-gray-500">
                        {result.item.amount} × {formatCurrency(result.item.rate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Sections */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            } text-gray-600 uppercase text-xs`}>
            <tr>
              <th className={`px-6 py-3 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>Code</th>
              <th className={`px-6 py-3 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>Description</th>
              <th className={`px-6 py-3 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>Amount</th>
              <th className={`px-6 py-3 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>Unit</th>
              <th className={`px-6 py-3 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>Rate</th>
              <th className={`px-6 py-3 text-right ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>Total</th>
            </tr>
          </thead>

          <tbody>
            {budget.sections.map((section) => (
              <React.Fragment key={section.id}>
                {/* Section Header */}
                <motion.tr
                  variants={sectionVariants}
                  onClick={() => toggleSection(section.id)}
                  className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    } font-semibold cursor-pointer hover:${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    } transition-colors`}
                >
                  <td className="px-6 py-3 text-indigo-600" colSpan={6}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-indigo-600 rounded"></div>
                        {section.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-normal text-gray-500">
                          {formatCurrency(section.total)}
                        </span>
                        {expandedSections.has(section.id) ?
                          <ChevronUp size={16} /> : <ChevronDown size={16} />
                        }
                      </div>
                    </div>
                  </td>
                </motion.tr>

                {/* Categories and Items */}
                <AnimatePresence>
                  {expandedSections.has(section.id) && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <td colSpan={6} className="p-0">
                        {section.categories.map((category) => (
                          <div key={category.code}>
                            {/* Category Header */}
                            <div className={`px-6 py-2 font-medium ${theme === 'dark'
                                ? 'bg-gray-600 text-indigo-300'
                                : 'bg-indigo-50 text-indigo-700'
                              }`}>
                              {category.code} - {category.name}
                              <span className="float-right">
                                {formatCurrency(category.total)}
                              </span>
                            </div>

                            {/* Line Items */}
                            {category.items.map((item) => (
                              <div
                                key={item.code}
                                className={`grid grid-cols-6 gap-4 px-6 py-2 hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                                  } transition-colors border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                                  }`}
                              >
                                <div className="font-medium text-gray-500">{item.code}</div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  {item.description}
                                </div>
                                <div className="text-right">
                                  {editing?.itemCode === item.code && editing?.field === 'amount' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                                        className={`w-20 p-1 border rounded text-right ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'border-gray-300'
                                          }`}
                                        autoFocus
                                      />
                                      <button onClick={saveEdit} className="text-green-600">
                                        <Save size={14} />
                                      </button>
                                      <button onClick={cancelEdit} className="text-red-600">
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded flex items-center justify-end gap-1"
                                      onClick={() => startEditing(section.id, category.code, item.code, 'amount', item.amount)}
                                    >
                                      {item.amount.toLocaleString()}
                                      <Edit2 size={12} className="opacity-50" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {item.unit}
                                </div>
                                <div className="text-right">
                                  {editing?.itemCode === item.code && editing?.field === 'rate' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                                        className={`w-24 p-1 border rounded text-right ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'border-gray-300'
                                          }`}
                                        autoFocus
                                      />
                                      <button onClick={saveEdit} className="text-green-600">
                                        <Save size={14} />
                                      </button>
                                      <button onClick={cancelEdit} className="text-red-600">
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded flex items-center justify-end gap-1"
                                      onClick={() => startEditing(section.id, category.code, item.code, 'rate', item.rate)}
                                    >
                                      {formatCurrency(item.rate)}
                                      <Edit2 size={12} className="opacity-50" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-right font-semibold">
                                  {formatCurrency(item.total)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};