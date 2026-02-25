// src/features/board/components/RichTextEditor.jsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function RichTextEditor({
  value = '',
  onChange,
  readOnly = false,
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // 외부 값 변경 시 동기화 (update 모드 대응)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid #ddd', padding: 10 }}>
      <EditorContent editor={editor} />
    </div>
  );
}
