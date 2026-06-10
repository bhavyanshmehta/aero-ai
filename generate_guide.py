from fpdf import FPDF

class ProjectGuide(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'Aero Ai - Comprehensive Project Guide & Viva Prep', 0, new_x="LMARGIN", new_y="NEXT", align='C')
        self.ln(5)

    def chapter_title(self, title):
        self.set_font('helvetica', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 10, title, 0, new_x="LMARGIN", new_y="NEXT", align='L', fill=True)
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('helvetica', '', 11)
        self.multi_cell(0, 8, body)
        self.ln()

def create_pdf():
    pdf = ProjectGuide()
    pdf.add_page()

    # Section 1: Roles
    pdf.chapter_title("1. Team Roles (7 Members)")
    pdf.chapter_body(
        "For a large group, roles are divided into technical and management categories:\n"
        "1. Project Lead & Architect: Designs the 3-tier system and oversees project timeline.\n"
        "2. Backend Developer: Writes the FastAPI routes and handles server-side logic.\n"
        "3. Frontend Developer: Creates the Glassmorphism UI, CSS animations, and JS events.\n"
        "4. Database Specialist: Designs the SQLite schema and ensures message persistence.\n"
        "5. QA & Testing Engineer: Conducts functional tests, debugging, and quality checks.\n"
        "6. Documentation Specialist: Authored the 30-page report, PPT, and user manual.\n"
        "7. Deployment & DevOps: Manages API keys, venv setup, and Render cloud deployment."
    )

    # Section 2: Code Explanation
    pdf.chapter_title("2. Code Explanation (How it Works)")
    pdf.chapter_body(
        "The project is split into two main Python files:\n"
        "- main.py: This is the 'Brain' of the server. It uses FastAPI to listen for user clicks. "
        "When you send a message, it grabs your text (and image), sends it to Google Gemini, "
        "and waits for the response.\n"
        "- database.py: This is the 'Memory'. It uses SQL commands (INSERT, SELECT) to store "
        "every chat. Without this, your messages would disappear every time you refresh."
    )

    # Section 3: The API Key
    pdf.chapter_title("3. Where is the API Key & How it Works?")
    pdf.chapter_body(
        "Where to get it: You get the key from 'Google AI Studio' (aistudio.google.com). It is "
        "a unique code that allows your app to talk to Google's massive AI servers.\n\n"
        "How it works: Think of the API Key as a 'Digital Passport'. Every time Aero Ai asks "
        "a question, it shows this passport to Google. If it's valid, Google processes the "
        "request and sends the answer back to your computer."
    )

    # Section 4: How the AI Gives Answers
    pdf.chapter_title("4. How does the AI 'Think'?")
    pdf.chapter_body(
        "Aero Ai uses a technology called 'Transformers' (Gemini 1.5). It doesn't 'know' "
        "things like a human does. Instead, it has read billions of pages of text. "
        "When you ask a question, it looks at the words and predicts the next most logical "
        "words to form a correct answer. Because it's 'Multimodal', it can also turn pixels "
        "from an image into text descriptions to answer questions about photos."
    )

    # Section 5: The Virtual Environment (venv)
    pdf.chapter_title("5. Why use 'venv'?")
    pdf.chapter_body(
        "Viva Tip: Always say 'Isolation'. venv creates an isolated environment so our "
        "specific libraries (like FastAPI or python-pptx) don't conflict with other Python "
        "software on the computer. It makes the project portable and stable."
    )

    # Section 6: Viva Preparation
    pdf.chapter_title("6. Final Viva Prep Q&A")
    pdf.chapter_body(
        "Q: Why FastAPI over Django?\n"
        "A: FastAPI is much faster for AI apps because it handles 'Asynchronous' tasks. "
        "It can wait for the AI response without freezing the whole website.\n\n"
        "Q: Is the database safe?\n"
        "A: Yes, SQLite is a ACID-compliant database, meaning it is very reliable "
        "for storing text data locally."
    )

    output_path = "/Users/bhavyansh/Documents/ANSHU/Aero_Ai_Group_Guide.pdf"
    pdf.output(output_path)
    print(f"PDF saved to {output_path}")

if __name__ == "__main__":
    create_pdf()
