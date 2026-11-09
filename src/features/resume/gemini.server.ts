import '@tanstack/react-start/server-only'
import { generateReview } from '~/lib/gemini.server'
import { WorkspaceError } from '~/lib/workspace-error.server'
import { atsReviewSchema, fitReviewSchema } from './review'

export function reviewResume(userId: string, resume: string) {
  return generateReview(userId, atsReviewSchema, [
    'Review this resume for a job seeker. Estimate ATS readiness out of 100, using up to 40 points for clear, conventional section structure,',
    '30 for clarity and readability, and 30 for specific evidence of impact.',
    'Explain each dimension and suggest up to six practical edits.',
    'Assess extracted text only. Do not make claims about the original layout or a specific ATS.',
  ].join(' '), { resume })
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase()

export async function reviewJobFit(userId: string, resume: string, jobDescription: string) {
  const review = await generateReview(userId, fitReviewSchema, [
    'Review this resume for a job seeker. Estimate fit out of 100 based on evidence for the stated requirements, prioritizing required qualifications.',
    'For each match, use a short verbatim quote from the posting for requirement and from the resume for evidence.',
    'List qualifications with insufficient evidence as gaps. Suggest truthful edits using only the evidence provided.',
  ].join(' '), { resume, jobDescription })

  const resumeText = normalize(resume)
  const postingText = normalize(jobDescription)
  if (review.matches.some(({ requirement, evidence }) => {
    const requirementText = normalize(requirement)
    const evidenceText = normalize(evidence)
    return !requirementText || !evidenceText || !postingText.includes(requirementText) || !resumeText.includes(evidenceText)
  })) {
    throw new WorkspaceError('Gemini returned evidence that could not be verified. Try the review again.')
  }
  return review
}
