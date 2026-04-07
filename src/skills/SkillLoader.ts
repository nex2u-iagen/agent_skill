import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface SkillMetadata {
    name: string;
    description: string;
    version?: string;
    author?: string;
    tools?: string[];
}

export interface Skill {
    metadata: SkillMetadata;
    content: string;
    path: string;
}

export class SkillLoader {
    private skillsDir = path.join(process.cwd(), '.agents', 'skills');

    public loadActiveSkills(): Skill[] {
        if (!fs.existsSync(this.skillsDir)) {
            console.warn(`[SkillLoader] Skills directory not found: ${this.skillsDir}`);
            return [];
        }

        const skillFolders = fs.readdirSync(this.skillsDir);
        const skills: Skill[] = [];

        for (const folder of skillFolders) {
            const skillPath = path.join(this.skillsDir, folder);
            if (!fs.statSync(skillPath).isDirectory()) continue;

            const skillFile = path.join(skillPath, 'SKILL.md');
            if (!fs.existsSync(skillFile)) {
                console.warn(`[SkillLoader] skipping skill folder ${folder}: SKILL.md missing.`);
                continue;
            }

            const rawContent = fs.readFileSync(skillFile, 'utf8');
            const parsed = this.parseSkillContent(rawContent);
            if (parsed) {
                skills.push({ ...parsed, path: skillPath });
            }
        }

        return skills;
    }

    private parseSkillContent(content: string): { metadata: SkillMetadata; content: string } | null {
        try {
            const frontmatterRegex = /^---\r?\n([\s\S]+?)\r?\n---/;
            const match = content.match(frontmatterRegex);

            if (!match) return null;

            const metadata = yaml.load(match[1]) as SkillMetadata;
            const skillContent = content.replace(frontmatterRegex, '').trim();

            return { metadata, content: skillContent };
        } catch (error) {
            console.error('[SkillLoader] Error parsing skill frontmatter:', error);
            return null;
        }
    }
}
