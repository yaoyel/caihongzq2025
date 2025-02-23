import React, { useEffect } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import styled from '@emotion/styled';

const EditorWrapper = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  
  .w-e-toolbar {
    border-bottom: 1px solid #f0f0f0;
  }
  
  .w-e-text-container {
    height: 300px !important;
    overflow-y: hidden;
  }
`;

interface QuestionEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onEditorCreated?: (editor: IDomEditor) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  value = '',
  onChange,
  onEditorCreated
}) => {
  const [editor, setEditor] = React.useState<IDomEditor | null>(null);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入你的答案...',
    MENU_CONF: {},
    onCreated: (editor: IDomEditor) => {
      setEditor(editor);
      onEditorCreated?.(editor);
    },
    onChange: (editor: IDomEditor) => {
      const html = editor.getHtml();
      onChange?.(html);
    }
  };

  return (
    <EditorWrapper>
      <Toolbar
        editor={editor}
        defaultConfig={{}}
        mode="default"
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        mode="default"
      />
    </EditorWrapper>
  );
};

export default QuestionEditor;