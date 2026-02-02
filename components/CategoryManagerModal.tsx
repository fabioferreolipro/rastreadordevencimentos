import React, { useState } from 'react';
import { Category } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCategory: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      color: newColor,
    };

    onAddCategory(newCategory);
    setNewName('');
    setNewColor('#3b82f6');
    setShowAddForm(false);
  };

  const handleEdit = (category: Category) => {
    setIsEditing(category.id);
    setNewName(category.name);
    setNewColor(category.color);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !isEditing) return;

    onEditCategory({
      id: isEditing,
      name: newName.trim(),
      color: newColor,
    });

    setIsEditing(null);
    setNewName('');
    setNewColor('#3b82f6');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">category</span>
            Gerenciar Categorias
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {showAddForm || isEditing ? (
            <form onSubmit={isEditing ? handleUpdate : handleAdd} className="space-y-4 mb-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Nome</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Ex: Assinaturas, Mercado..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Cor</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                  {isEditing ? 'Salvar' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setShowAddForm(false);
                    setNewName('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-400 hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
              Nova Categoria
            </button>
          )}

          <div className="space-y-2">
            {categories.map((category) => (
              <div 
                key={category.id}
                className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/50 rounded-2xl group hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-white font-medium">{category.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteCategory(category.id)}
                    className="p-2 text-slate-400 hover:text-danger transition-colors"
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
