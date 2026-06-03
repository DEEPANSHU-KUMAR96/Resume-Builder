import { Types } from "mongoose";

export interface IPersonalInfo {
    fullname: string;
    email: string;
    mobile: string;
    location: string;
    github: string;
    linkedin: string;
    portfolio: string;
}

export interface IWorkExperience {
    position: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface IProject {
    title: string;
    description: string;
    githubUrl: string;
    liveUrl: string;
    techStack: string[];

}

export interface IEducation {
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    // description: string;
}

export interface IResume {
    _id?: string;
    user_id: Types.ObjectId;
    title: string;
    summary: string;
    personalInfo: IPersonalInfo;
    workExperience?: IWorkExperience[];
    projects: IProject[];
    skills: string[];
    education: IEducation[];
    certifications?: string[];
    createdAt?: Date,
    updatedAt: Date
}