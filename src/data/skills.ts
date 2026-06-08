// Skill data configuration file
// Used to manage data for the skill display page

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string; // Iconify icon name
  category: "frontend" | "backend" | "database" | "tools" | "other";
  level: "beginner" | "intermediate" | "advanced" | "expert";
  experience: {
    years: number;
    months: number;
  };
  projects?: string[]; // Related project IDs
  certifications?: string[];
  color?: string; // Skill card theme color
}

export const skillsData: Skill[] = [
  // Frontend Skills
  {
    id: "javascript",
    name: "JavaScript",
    description:
      "Modern JavaScript development, including ES6+ syntax, asynchronous programming, and modular development.",
    icon: "logos:javascript",
    category: "frontend",
    level: "advanced",
    experience: { years: 3, months: 6 },
    projects: ["mizuki-blog", "portfolio-website", "data-visualization-tool"],
    color: "#F7DF1E",
  },
  {
    id: "typescript",
    name: "TypeScript",
    description:
      "A type-safe superset of JavaScript that enhances code quality and development efficiency.",
    icon: "logos:typescript-icon",
    category: "frontend",
    level: "advanced",
    experience: { years: 2, months: 8 },
    projects: ["mizuki-blog", "portfolio-website", "task-manager-app"],
    color: "#3178C6",
  },
  {
    id: "react",
    name: "React",
    description:
      "A JavaScript library for building user interfaces, including Hooks, Context, and state management.",
    icon: "logos:react",
    category: "frontend",
    level: "advanced",
    experience: { years: 2, months: 10 },
    projects: ["portfolio-website", "task-manager-app"],
    color: "#61DAFB",
  },
  {
    id: "vue",
    name: "Vue.js",
    description:
      "A progressive JavaScript framework that is easy to learn and use, suitable for rapid development.",
    icon: "logos:vue",
    category: "frontend",
    level: "intermediate",
    experience: { years: 1, months: 8 },
    projects: ["data-visualization-tool"],
    color: "#4FC08D",
  },
  {
    id: "nuxtjs",
    name: "Nuxt.js",
    description:
      "An intuitive Vue.js framework supporting server-side rendering and static site generation.",
    icon: "logos:nuxt-icon",
    category: "frontend",
    level: "beginner",
    experience: { years: 0, months: 6 },
    projects: ["vue-ssr-app"],
    color: "#00DC82",
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    description:
      "A utility-first CSS framework for rapidly building modern user interfaces.",
    icon: "logos:tailwindcss-icon",
    category: "frontend",
    level: "advanced",
    experience: { years: 2, months: 0 },
    projects: ["mizuki-blog", "portfolio-website"],
    color: "#06B6D4",
  },
  {
    id: "sass",
    name: "Sass/SCSS",
    description:
      "A CSS preprocessor providing advanced features like variables, nesting, and mixins.",
    icon: "logos:sass",
    category: "frontend",
    level: "intermediate",
    experience: { years: 2, months: 3 },
    projects: ["legacy-website", "component-library"],
    color: "#CF649A",
  },
  {
    id: "vite",
    name: "Vite",
    description:
      "Next-generation frontend build tool with fast cold starts and hot updates.",
    icon: "logos:vitejs",
    category: "frontend",
    level: "intermediate",
    experience: { years: 1, months: 2 },
    projects: ["vue-project", "react-project"],
    color: "#646CFF",
  },

  // Backend Skills
  {
    id: "nodejs",
    name: "Node.js",
    description:
      "A JavaScript runtime based on Chrome V8 engine, used for server-side development.",
    icon: "logos:nodejs-icon",
    category: "backend",
    level: "intermediate",
    experience: { years: 2, months: 3 },
    projects: ["data-visualization-tool", "e-commerce-platform"],
    color: "#339933",
  },
  {
    id: "python",
    name: "Python",
    description:
      "A general-purpose programming language suitable for web development, data analysis, machine learning, and more.",
    icon: "logos:python",
    category: "backend",
    level: "intermediate",
    experience: { years: 1, months: 10 },
    color: "#3776AB",
  },
  {
    id: "express",
    name: "Express.js",
    description: "A fast, minimalist Node.js web application framework.",
    icon: "simple-icons:express",
    category: "backend",
    level: "intermediate",
    experience: { years: 1, months: 8 },
    projects: ["data-visualization-tool"],
    color: "#616161", // 更改为深灰色，避免纯黑色
  },

  // Database Skills
  {
    id: "mysql",
    name: "MySQL",
    description:
      "The world's most popular open-source relational database management system, widely used in web applications.",
    icon: "logos:mysql-icon",
    category: "database",
    level: "advanced",
    experience: { years: 2, months: 6 },
    projects: ["e-commerce-platform", "blog-system"],
    color: "#4479A1",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description:
      "A powerful open-source relational database management system.",
    icon: "logos:postgresql",
    category: "database",
    level: "intermediate",
    experience: { years: 1, months: 5 },
    projects: ["e-commerce-platform"],
    color: "#336791",
  },
  {
    id: "redis",
    name: "Redis",
    description:
      "A high-performance in-memory data structure store, used as a database, cache, and message broker.",
    icon: "logos:redis",
    category: "database",
    level: "intermediate",
    experience: { years: 1, months: 3 },
    projects: ["e-commerce-platform", "real-time-chat"],
    color: "#DC382D",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description:
      "A document-oriented NoSQL database with a flexible data model.",
    icon: "logos:mongodb-icon",
    category: "database",
    level: "intermediate",
    experience: { years: 1, months: 2 },
    color: "#47A248",
  },
  // Tools
  {
    id: "git",
    name: "Git",
    description:
      "A distributed version control system, an essential tool for code management and team collaboration.",
    icon: "logos:git-icon",
    category: "tools",
    level: "advanced",
    experience: { years: 3, months: 0 },
    color: "#F05032",
  },
  {
    id: "vscode",
    name: "VS Code",
    description:
      "A lightweight but powerful code editor with a rich plugin ecosystem.",
    icon: "logos:visual-studio-code",
    category: "tools",
    level: "expert",
    experience: { years: 3, months: 6 },
    color: "#007ACC",
  },
  {
    id: "pycharm",
    name: "PyCharm",
    description:
      "A professional Python IDE by JetBrains providing intelligent code analysis and debugging features.",
    icon: "logos:pycharm",
    category: "tools",
    level: "intermediate",
    experience: { years: 1, months: 4 },
    projects: ["python-web-app", "data-analysis"],
    color: "#21D789",
  },

  {
    id: "docker",
    name: "Docker",
    description:
      "A containerization platform that simplifies application deployment and environment management.",
    icon: "logos:docker-icon",
    category: "tools",
    level: "intermediate",
    experience: { years: 1, months: 0 },
    color: "#2496ED",
  },
  {
    id: "nginx",
    name: "Nginx",
    description: "A high-performance web server and reverse proxy server.",
    icon: "logos:nginx",
    category: "tools",
    level: "intermediate",
    experience: { years: 1, months: 2 },
    projects: ["web-server-config", "load-balancer"],
    color: "#009639",
  },

  {
    id: "postman",
    name: "Postman",
    description:
      "An API development and testing tool that simplifies API design, testing, and documentation.",
    icon: "logos:postman-icon",
    category: "tools",
    level: "intermediate",
    experience: { years: 1, months: 8 },
    projects: ["api-testing", "api-documentation"],
    color: "#FF6C37",
  },
  {
    id: "figma",
    name: "Figma",
    description:
      "A collaborative interface design tool for UI/UX design and prototyping.",
    icon: "logos:figma",
    category: "tools",
    level: "intermediate",
    experience: { years: 1, months: 6 },
    color: "#F24E1E",
  },

  // Other Skills
];
