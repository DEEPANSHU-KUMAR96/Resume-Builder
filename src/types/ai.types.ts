export interface GenerateSummaryBody {
    experienceLevel: string;
    skills: string[];
    jobTitle: string;
}

export interface GenerateSkillsBody {
    experienceLevel: string;
    jobTitle: string;
}

export interface GenerateProjectDescriptionBody {
    experienceLevel: string;
    jobTitle: string;
    techStack: string[];
}

export interface GenerateWorkExperienceBody {
    jobRole: string;
    companyName: string;
    experienceLevel: number;
    duration: string;
    techStack: string[];
}