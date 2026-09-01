import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  SourceEditing,
  Underline,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder = "Bắt đầu viết nội dung phần truyện..." }: RichTextEditorProps) {
  return (
    <div className="rich-editor overflow-hidden rounded-[14px] border border-[#d5d1c8] bg-white shadow-[0_4px_18px_rgba(24,51,58,0.04)]">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onChange={(_, editor) => onChange(editor.getData())}
        config={{
          licenseKey: "GPL",
          placeholder,
          plugins: [Essentials, Paragraph, Heading, Bold, Italic, Underline, Link, List, BlockQuote, SourceEditing],
          toolbar: ["undo", "redo", "|", "heading", "|", "bold", "italic", "underline", "|", "link", "bulletedList", "numberedList", "blockQuote", "sourceEditing"],
          heading: {
            options: [
              { model: "paragraph", title: "Đoạn văn", class: "ck-heading_paragraph" },
              { model: "heading2", view: "h2", title: "Tiêu đề lớn", class: "ck-heading_heading2" },
              { model: "heading3", view: "h3", title: "Tiêu đề nhỏ", class: "ck-heading_heading3" },
            ],
          },
        }}
      />
    </div>
  );
}
