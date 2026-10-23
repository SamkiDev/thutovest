// src/data/documents.ts
var DOCUMENT_INFO = {
	"admission-letter": {
		label: "Admission letter",
		short: "Admission",
		hint: "Your offer or admission letter from the university, college or TVET.",
		issuerCheck: true
	},
	"id-copy": {
		label: "Certified copy of ID",
		short: "ID copy",
		hint: "Certified within the last 3 months.",
		issuerCheck: false
	},
	"latest-results": {
		label: "Latest school results",
		short: "Results",
		hint: "Grade 11 final, Grade 12 June or final NSC results.",
		issuerCheck: true
	},
	"income-proof": {
		label: "Proof of household income",
		short: "Income",
		hint: "Payslips, a SASSA letter or an affidavit for each earning adult.",
		issuerCheck: false
	},
	"motivation-letter": {
		label: "Motivation letter",
		short: "Motivation",
		hint: "Written in the app. Tell a sponsor why you’re studying and what support would change.",
		issuerCheck: false,
		writeInApp: true
	},
	"registration-proof": {
		label: "Proof of registration",
		short: "Registration",
		hint: "From your institution once you’ve registered.",
		issuerCheck: true
	},
	"semester-results": {
		label: "Semester results",
		short: "Semester results",
		hint: "Your academic record after each semester, for funded students.",
		issuerCheck: true
	}
};
// src/utils/trust.ts
/** Registration number formats: company 2019/123456/07, NPO 123-456 NPO, trust IT1234/2015. */
function validRegistration(type, value) {
	const v = value.trim().toUpperCase();
	if (type === "company") return /^(19|20)\d{2}\/\d{6}\/\d{2}$/.test(v);
	if (type === "npo") return /^\d{3}-\d{3}\s?NPO$/.test(v);
	return /^IT\s?\d{1,6}\/\d{4}$/.test(v);
}
// src/platform/authorize.ts
var LIMITS = {
	message: 1e3,
	note: 500,
	name: 80,
	about: 600,
	registration: 20,
	maxAmount: 1e6,
	maxBudget: 1e8,
	maxPlaces: 1e3
};
var clip = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : "";
var money = (v, max) => typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max ? Math.round(v) : null;
var isDocKind = (k) => typeof k === "string" && k in DOCUMENT_INFO;
var isTrust = (v) => v === 0 || v === 1 || v === 2 || v === 3;
var listOrAll = (v) => v === "all" ? "all" : Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 20) : "all";
var isoDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
function appOf(state, applicationId) {
	const app = state.applications.find((a) => a.id === applicationId);
	return {
		app,
		sponsorId: (app ? state.funds.find((f) => f.id === app.fundId) : void 0)?.sponsorId
	};
}
function shareOf(state, shareId) {
	const share = state.documents.find((d) => d.id === shareId);
	return {
		share,
		...share ? appOf(state, share.applicationId) : {
			app: void 0,
			sponsorId: void 0
		}
	};
}
var fundOwner = (state, fundId) => state.funds.find((f) => f.id === fundId)?.sponsorId;
/**
* Returns the action to apply (with untrusted fields whitelisted and clipped),
* or null when the signed-in user may not perform it.
*/
function authorize(state, action, session) {
	const student = session?.role === "student" ? session.userId : null;
	const sponsor = session?.role === "sponsor" ? session.userId : null;
	switch (action.type) {
		case "hydrate":
		case "reset": return action;
		case "expressInterest": return student && action.studentId === student ? {
			...action,
			studentName: clip(action.studentName, LIMITS.name)
		} : null;
		case "respondOffer": {
			const { app } = appOf(state, action.applicationId);
			if (!student || app?.studentId !== student) return null;
			const a = action.agreement;
			return {
				...action,
				studentName: clip(action.studentName, LIMITS.name),
				agreement: a && {
					...a,
					signedName: clip(a.signedName, LIMITS.name),
					guardianName: a.guardianName ? clip(a.guardianName, LIMITS.name) : void 0
				}
			};
		}
		case "shareDocument": {
			const { app } = shareOf(state, action.shareId);
			return student && app?.studentId === student ? {
				...action,
				studentName: clip(action.studentName, LIMITS.name)
			} : null;
		}
		case "publishCandidate": {
			if (!student || action.profile?.id !== student) return null;
			const profile = sanitizeCandidate(action.profile, student);
			return profile ? {
				type: "publishCandidate",
				profile
			} : null;
		}
		case "sendMessage": {
			const { app, sponsorId } = appOf(state, action.applicationId);
			if (!app) return null;
			return action.from === "student" && app.studentId === student || action.from === "sponsor" && sponsorId === sponsor ? {
				...action,
				text: clip(action.text, LIMITS.message)
			} : null;
		}
		case "shortlist":
		case "declineCandidate":
			if (!sponsor || fundOwner(state, action.fundId) !== sponsor) return null;
			return action.type === "declineCandidate" ? {
				...action,
				reason: clip(action.reason, LIMITS.note)
			} : action;
		case "sendOffer": {
			if (!sponsor || fundOwner(state, action.fundId) !== sponsor) return null;
			const amount = money(action.amount, LIMITS.maxAmount);
			if (amount == null) return null;
			return {
				...action,
				amount,
				note: clip(action.note, LIMITS.note),
				studentName: clip(action.studentName, LIMITS.name),
				requiredDocs: action.requiredDocs.filter(isDocKind)
			};
		}
		case "reviewDocument":
		case "remindDocument":
		case "confirmShareIssuer": {
			const { sponsorId } = shareOf(state, action.shareId);
			if (!sponsor || sponsorId !== sponsor) return null;
			return action.type === "reviewDocument" ? {
				...action,
				note: action.note ? clip(action.note, LIMITS.note) : void 0
			} : action;
		}
		case "requestDocument": {
			const { sponsorId } = appOf(state, action.applicationId);
			if (!sponsor || sponsorId !== sponsor || !isDocKind(action.kind)) return null;
			return {
				...action,
				note: action.note ? clip(action.note, LIMITS.note) : void 0
			};
		}
		case "approveFunding":
		case "payInstitution": {
			const { sponsorId } = appOf(state, action.applicationId);
			return sponsor && sponsorId === sponsor ? action : null;
		}
		case "closeFund": return sponsor && fundOwner(state, action.fundId) === sponsor ? action : null;
		case "saveFund": {
			if (!sponsor) return null;
			const existing = state.funds.find((f) => f.id === action.fund.id);
			if (existing && existing.sponsorId !== sponsor) return null;
			const fund = sanitizeFund(action.fund, sponsor, existing);
			return fund ? {
				type: "saveFund",
				fund
			} : null;
		}
		case "setSponsorCheck": return sponsor && action.sponsorId === sponsor ? action : null;
		case "registerSponsor": {
			if (state.sponsors.some((s) => s.id === action.sponsor.id)) return null;
			const clean = sanitizeSponsor(action.sponsor);
			return clean ? {
				type: "registerSponsor",
				sponsor: clean
			} : null;
		}
	}
}
/** Only fields a sponsor may edit. Ownership, status and dates are set here, never by the client. */
function sanitizeFund(f, sponsorId, existing) {
	const budget = money(f.budget, LIMITS.maxBudget);
	const maxPerStudent = money(f.maxPerStudent, LIMITS.maxAmount);
	const places = money(f.places, LIMITS.maxPlaces);
	const closesOn = isoDate(f.closesOn);
	const name = clip(f.name, LIMITS.name);
	if (!budget || !maxPerStudent || !places || !closesOn || !name || maxPerStudent > budget) return null;
	return {
		id: existing?.id ?? f.id,
		sponsorId,
		name,
		description: clip(f.description, LIMITS.about),
		budget,
		maxPerStudent,
		places,
		fields: listOrAll(f.fields),
		provinces: listOrAll(f.provinces),
		incomeBands: listOrAll(f.incomeBands),
		minTrust: isTrust(f.minTrust) ? f.minTrust : 2,
		...f.disabilityOnly === true ? { disabilityOnly: true } : {},
		closesOn,
		status: existing?.status ?? "open",
		createdAt: existing?.createdAt ?? (/* @__PURE__ */ new Date()).toISOString()
	};
}
function sanitizeSponsor(s) {
	const type = [
		"company",
		"trust",
		"npo"
	].find((t) => t === s.type);
	const registrationNumber = clip(s.registrationNumber, LIMITS.registration).toUpperCase();
	const name = clip(s.name, LIMITS.name);
	if (!type || name.length < 3 || !validRegistration(type, registrationNumber)) return null;
	return {
		id: s.id,
		name,
		type,
		registrationNumber,
		contactName: clip(s.contactName, LIMITS.name),
		about: clip(s.about, LIMITS.about),
		verification: {
			organisation: { status: "not-started" },
			representative: { status: "not-started" },
			bank: { status: "not-started" }
		},
		status: "active",
		isDemo: false,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
var VERIFICATION_STATUSES = [
	"not-started",
	"pending",
	"verified",
	"failed"
];
var CHECK_KEYS = [
	"identity",
	"enrolment",
	"results",
	"income",
	"guardian"
];
var ratio = (v) => typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
var count = (v, max) => typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.round(v))) : 0;
/**
* Only the anonymised fields a sponsor may see, with types and ranges forced.
* The id is always the signed-in student's own. Trust and checks are still
* client-computed in this prototype; in production they come from the
* verification service, never the student.
*/
function sanitizeCandidate(p, studentId) {
	if (!p || typeof p !== "object") return null;
	const firstName = clip(p.firstName, 40);
	if (!firstName) return null;
	const checks = Object.fromEntries(CHECK_KEYS.map((k) => [k, VERIFICATION_STATUSES.includes(p.checks?.[k]) ? p.checks[k] : "not-started"]));
	const aps = typeof p.apsEstimate === "number" && p.apsEstimate >= 0 && p.apsEstimate <= 60 ? Math.round(p.apsEstimate) : null;
	return {
		id: studentId,
		firstName,
		province: clip(p.province, 30),
		field: clip(p.field, 40),
		educationStage: clip(p.educationStage, 40),
		institutionId: p.institutionId ? clip(p.institutionId, 40) : null,
		householdIncome: clip(p.householdIncome, 40),
		apsEstimate: aps,
		isAdult: p.isAdult === true,
		trust: isTrust(p.trust) ? p.trust : 0,
		checks,
		totalCost: count(p.totalCost, LIMITS.maxAmount),
		identifiedFunding: count(p.identifiedFunding, LIMITS.maxAmount),
		gap: count(p.gap, LIMITS.maxAmount),
		onTimeRate: p.onTimeRate == null ? null : ratio(p.onTimeRate),
		tasksCompleted: count(p.tasksCompleted, 1e3),
		progressRatio: ratio(p.progressRatio),
		discoverable: p.discoverable === true,
		isLive: true
	};
}
/** Shape check for state arriving from storage or another tab before it replaces ours. */
function isPlatformState(v) {
	if (!v || typeof v !== "object") return false;
	const s = v;
	return s.version === 1 && [
		"sponsors",
		"funds",
		"applications",
		"messages",
		"documents",
		"events"
	].every((k) => Array.isArray(s[k])) && typeof s.decisions === "object" && s.decisions !== null;
}
// src/utils/dates.ts
function todayISO() {
	return toISODate(/* @__PURE__ */ new Date());
}
function toISODate(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISODate(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function addDays(iso, days) {
	const d = fromISODate(iso);
	d.setDate(d.getDate() + days);
	return toISODate(d);
}
new Intl.DateTimeFormat("en-ZA", {
	weekday: "short",
	day: "numeric",
	month: "short"
});
new Intl.DateTimeFormat("en-ZA", {
	day: "numeric",
	month: "short"
});
// src/config/brand.ts
/**
* Product name and copy in one place. To rename the app, change these values
* (and the <title>/meta in index.html).
*/
var BRAND = {
	name: "ThutoVest",
	/** Logo wordmark: first part in ink, second part in the accent colour. */
	wordmark: ["Thuto", "Vest"],
	tagline: "From “I want to study” to “I can graduate.”",
	demoDomain: "thutovest.demo",
	storagePrefix: "thutovest",
	/** Official WhatsApp number in E.164 without '+', e.g. '27600000000'. Empty until the number is live: the app then shows the simulator only. */
	whatsappNumber: ""
};
// src/data/platformSeed.ts
/**
* DEMONSTRATION MARKETPLACE. Every sponsor, fund and student below is
* fictional. Registration numbers follow real formats but are invented.
*/
var hoursAgo = (h) => (/* @__PURE__ */ new Date(Date.now() - h * 36e5)).toISOString();
var verified = {
	status: "verified",
	updatedAt: hoursAgo(480)
};
var DEMO_SPONSOR_ID = "sp-ridgeline";
var SCAM_SPONSOR_ID = "sp-quickbursary";
var RESHOKETSWE_ID = "sp-reshoketswe";
`${BRAND.demoDomain}`;
function sponsors() {
	return [
		{
			id: DEMO_SPONSOR_ID,
			name: "Ridgeline Technologies",
			type: "company",
			registrationNumber: "2016/412233/07",
			contactName: "Anele",
			about: "A fictional Johannesburg software company funding the next generation of South African developers and engineers.",
			verification: {
				organisation: verified,
				representative: verified,
				bank: verified
			},
			status: "active",
			isDemo: true,
			createdAt: hoursAgo(2880)
		},
		{
			id: RESHOKETSWE_ID,
			name: "Reshoketswe Foundation",
			type: "trust",
			registrationNumber: "IT0417/2019",
			contactName: "Reshoketswe",
			about: "A fictional trust funding students with disabilities, including assistive devices and campus support.",
			verification: {
				organisation: verified,
				representative: verified,
				bank: verified
			},
			status: "active",
			isDemo: true,
			createdAt: hoursAgo(1440)
		},
		{
			id: "sp-community",
			name: "Community Futures Trust",
			type: "trust",
			registrationNumber: "IT2210/2012",
			contactName: "Busisiwe",
			about: "A fictional community trust supporting first-generation students in any field.",
			verification: {
				organisation: verified,
				representative: verified,
				bank: verified
			},
			status: "active",
			isDemo: true,
			createdAt: hoursAgo(7200)
		},
		{
			id: SCAM_SPONSOR_ID,
			name: "QuickBursary SA",
			type: "company",
			registrationNumber: "2025/889104/07",
			contactName: "Mr K.",
			about: "Fictional example of a fraudulent sponsor, included to demonstrate scam protection.",
			verification: {
				organisation: {
					status: "verified",
					updatedAt: hoursAgo(80)
				},
				representative: {
					status: "pending",
					updatedAt: hoursAgo(80)
				},
				bank: { status: "not-started" }
			},
			status: "suspended",
			suspendedReason: "Asked a student to pay an “admin fee”. Account suspended pending review.",
			isDemo: true,
			createdAt: hoursAgo(90)
		}
	];
}
function funds(start) {
	return [
		{
			id: "fund-ridge-dev",
			sponsorId: DEMO_SPONSOR_ID,
			name: "Future Developers Bursary 2027",
			description: "Tuition and accommodation for first-year computing and engineering. Paid December work week.",
			budget: 6e5,
			maxPerStudent: 6e4,
			places: 10,
			fields: ["computing", "engineering"],
			provinces: "all",
			incomeBands: ["under-350k", "350k-600k"],
			minTrust: 1,
			closesOn: addDays(start, 30),
			status: "open",
			createdAt: hoursAgo(504)
		},
		{
			id: "fund-ridge-eng",
			sponsorId: DEMO_SPONSOR_ID,
			name: "Engineering Access Fund",
			description: "Top-up awards for engineering students from Gauteng, Limpopo and Mpumalanga.",
			budget: 27e4,
			maxPerStudent: 45e3,
			places: 6,
			fields: ["engineering"],
			provinces: [
				"Gauteng",
				"Limpopo",
				"Mpumalanga"
			],
			incomeBands: "all",
			minTrust: 2,
			closesOn: addDays(start, 52),
			status: "open",
			createdAt: hoursAgo(216)
		},
		{
			id: "fund-reshoketswe",
			sponsorId: RESHOKETSWE_ID,
			name: "Reshoketswe Bursary for Students with Disabilities",
			description: "Tuition, assistive devices and support for students with disabilities. Any field.",
			budget: 4e5,
			maxPerStudent: 5e4,
			places: 10,
			fields: "all",
			provinces: "all",
			incomeBands: ["under-350k", "350k-600k"],
			minTrust: 2,
			disabilityOnly: true,
			closesOn: addDays(start, 38),
			status: "open",
			createdAt: hoursAgo(336)
		},
		{
			id: "fund-community-first",
			sponsorId: "sp-community",
			name: "First-Generation Scholarship",
			description: "First in your family to study after school. Any field.",
			budget: 24e4,
			maxPerStudent: 2e4,
			places: 12,
			fields: "all",
			provinces: "all",
			incomeBands: "all",
			minTrust: 2,
			closesOn: addDays(start, 45),
			status: "open",
			createdAt: hoursAgo(720)
		},
		{
			id: "fund-quick",
			sponsorId: SCAM_SPONSOR_ID,
			name: "Instant Study Grant",
			description: "Suspended listing.",
			budget: 5e5,
			maxPerStudent: 5e4,
			places: 10,
			fields: "all",
			provinces: "all",
			incomeBands: "all",
			minTrust: 0,
			closesOn: addDays(start, 5),
			status: "closed",
			createdAt: hoursAgo(90)
		}
	];
}
var POOL = [
	{
		id: "stu-lerato",
		firstName: "Lerato",
		province: "Limpopo",
		field: "computing",
		educationStage: "grade12",
		institutionId: "tut",
		householdIncome: "under-350k",
		apsEstimate: 34,
		isAdult: true,
		trust: 3,
		totalCost: 98e3,
		gap: 58e3,
		onTimeRate: .92,
		tasksCompleted: 14,
		progressRatio: .62
	},
	{
		id: "stu-sipho",
		firstName: "Sipho",
		province: "KwaZulu-Natal",
		field: "engineering",
		educationStage: "gap-year",
		institutionId: "dut",
		householdIncome: "under-350k",
		apsEstimate: 30,
		isAdult: true,
		trust: 2,
		totalCost: 89e3,
		gap: 41500,
		onTimeRate: .75,
		tasksCompleted: 9,
		progressRatio: .45
	},
	{
		id: "stu-ayesha",
		firstName: "Ayesha",
		province: "Western Cape",
		field: "computing",
		educationStage: "grade12",
		institutionId: "cput",
		householdIncome: "350k-600k",
		apsEstimate: 36,
		isAdult: true,
		trust: 2,
		totalCost: 92e3,
		gap: 36800,
		onTimeRate: .88,
		tasksCompleted: 12,
		progressRatio: .55
	},
	{
		id: "stu-amahle",
		firstName: "Amahle",
		province: "KwaZulu-Natal",
		field: "computing",
		educationStage: "grade12",
		institutionId: "ukzn",
		householdIncome: "under-350k",
		apsEstimate: 33,
		isAdult: false,
		trust: 3,
		totalCost: 101e3,
		gap: 47200,
		onTimeRate: .83,
		tasksCompleted: 11,
		progressRatio: .5
	},
	{
		id: "stu-pieter",
		firstName: "Pieter",
		province: "Northern Cape",
		field: "engineering",
		educationStage: "grade12",
		institutionId: "sun",
		householdIncome: "350k-600k",
		apsEstimate: 37,
		isAdult: true,
		trust: 2,
		totalCost: 128e3,
		gap: 86e3,
		onTimeRate: .6,
		tasksCompleted: 6,
		progressRatio: .3
	},
	{
		id: "stu-mpho",
		firstName: "Mpho",
		province: "Gauteng",
		field: "commerce",
		educationStage: "grade12",
		institutionId: "uj",
		householdIncome: "under-350k",
		apsEstimate: 29,
		isAdult: true,
		trust: 2,
		totalCost: 84e3,
		gap: 33e3,
		onTimeRate: .8,
		tasksCompleted: 10,
		progressRatio: .48
	},
	{
		id: "stu-naledi",
		firstName: "Naledi",
		province: "Free State",
		field: "engineering",
		educationStage: "grade12",
		institutionId: "ufs",
		householdIncome: "prefer-not",
		apsEstimate: 31,
		isAdult: false,
		trust: 1,
		totalCost: 96e3,
		gap: 7e4,
		onTimeRate: null,
		tasksCompleted: 2,
		progressRatio: .12
	},
	{
		id: "stu-themba",
		firstName: "Themba",
		province: "Mpumalanga",
		field: "computing",
		educationStage: "grade12",
		institutionId: "tut",
		householdIncome: "under-350k",
		apsEstimate: 27,
		isAdult: true,
		trust: 0,
		totalCost: 88e3,
		gap: 64e3,
		onTimeRate: .5,
		tasksCompleted: 3,
		progressRatio: .15,
		discoverable: false
	},
	{
		id: "stu-kagiso",
		firstName: "Kagiso",
		province: "North West",
		field: "computing",
		educationStage: "first-year",
		institutionId: "up",
		householdIncome: "under-350k",
		apsEstimate: 35,
		isAdult: true,
		trust: 3,
		totalCost: 104e3,
		gap: 0,
		onTimeRate: .95,
		tasksCompleted: 19,
		progressRatio: .9,
		results: [{
			term: "Semester 1, 2026",
			average: 71,
			creditsPassed: 60,
			creditsTaken: 64
		}]
	},
	{
		id: "stu-zanele",
		firstName: "Zanele",
		province: "Eastern Cape",
		field: "computing",
		educationStage: "first-year",
		institutionId: "nmu",
		householdIncome: "under-350k",
		apsEstimate: 30,
		isAdult: true,
		trust: 3,
		totalCost: 86e3,
		gap: 0,
		onTimeRate: .9,
		tasksCompleted: 17,
		progressRatio: .85,
		results: [{
			term: "Semester 1, 2026",
			average: 64,
			creditsPassed: 56,
			creditsTaken: 64
		}]
	}
];
function pool() {
	return POOL.map((p) => {
		const v = (cond) => cond ? "verified" : "not-started";
		return {
			...p,
			discoverable: p.discoverable ?? true,
			isLive: false,
			identifiedFunding: p.totalCost - p.gap,
			checks: {
				identity: v(p.trust >= 1),
				guardian: p.isAdult ? "not-started" : v(p.trust >= 2 || p.id === "stu-naledi"),
				enrolment: v(p.trust >= 2),
				results: v(p.trust >= 3),
				income: v(p.trust >= 3)
			}
		};
	});
}
function applications() {
	const a = (id, fundId, studentId, status, extra = {}, h = 48) => ({
		id,
		fundId,
		studentId,
		status,
		initiatedBy: "sponsor",
		createdAt: hoursAgo(h + 24),
		updatedAt: hoursAgo(h),
		...extra
	});
	return [
		a("app-kagiso", "fund-ridge-dev", "stu-kagiso", "paid", {
			amount: 45e3,
			paymentReference: "RDG-26-0412"
		}, 4800),
		a("app-zanele", "fund-ridge-dev", "stu-zanele", "paid", {
			amount: 38e3,
			paymentReference: "RDG-26-0419"
		}, 4752),
		a("app-lerato", "fund-ridge-dev", "stu-lerato", "offered", { amount: 58e3 }, 20),
		a("app-sipho", "fund-ridge-dev", "stu-sipho", "shortlisted", { initiatedBy: "student" }, 30),
		a("app-ayesha", "fund-ridge-dev", "stu-ayesha", "accepted", {
			initiatedBy: "student",
			amount: 36800,
			agreement: {
				signedName: "Ayesha (surname on file)",
				signedAt: hoursAgo(30),
				terms: []
			}
		}, 5),
		a("app-tatenda-quick", "fund-quick", "stu-tatenda", "declined-by-sponsor", { declineReason: "Sponsor suspended for requesting a fee" }, 72)
	];
}
function messages() {
	return [
		{
			id: "m-q1",
			applicationId: "app-tatenda-quick",
			from: "system",
			text: "QuickBursary SA started a conversation about the Instant Study Grant.",
			at: hoursAgo(73)
		},
		{
			id: "m-q2",
			applicationId: "app-tatenda-quick",
			from: "sponsor",
			text: "Congratulations Tatenda! You qualify for R50,000. To release it, pay a R350 admin fee by eWallet to 082 555 0199 today.",
			at: hoursAgo(72),
			blocked: true,
			flags: [{
				kind: "payment-request",
				label: "Request for payment"
			}, {
				kind: "contact-details",
				label: "Phone number"
			}]
		},
		{
			id: "m-q3",
			applicationId: "app-tatenda-quick",
			from: "system",
			text: "We blocked a fee request. Real sponsors never ask for money. You did nothing wrong.",
			at: hoursAgo(72)
		},
		{
			id: "m-a1",
			applicationId: "app-ayesha",
			from: "system",
			text: "Ayesha accepted and signed the funding agreement in the app. Next: documents.",
			at: hoursAgo(30)
		},
		{
			id: "m-a2",
			applicationId: "app-ayesha",
			from: "student",
			text: "I’ve shared my admission letter and June results. My mom is getting the SASSA letter this week.",
			at: hoursAgo(6)
		},
		{
			id: "m-l1",
			applicationId: "app-lerato",
			from: "sponsor",
			text: "Hi Lerato, we’d like to offer you R58,000 towards your BSc at TUT. The full amount is paid to your fee account.",
			at: hoursAgo(20)
		}
	];
}
function snap(kind, fileName, extracted, opts = {}) {
	const findings = [
		{
			label: "File type",
			ok: true,
			detail: "PDF or photo"
		},
		{
			label: "Readability",
			ok: true,
			detail: "Text is readable"
		},
		{
			label: "Document type",
			ok: true,
			detail: "Recognised automatically"
		},
		{
			label: "Name matches the profile",
			ok: true
		},
		...opts.warning ? [{
			label: "Needs a look",
			ok: false,
			detail: opts.warning,
			severity: "warning"
		}] : [],
		{
			label: "Signs of editing",
			ok: true,
			detail: "None found"
		}
	];
	return {
		documentId: `vault-${fileName}`,
		kind,
		fileName,
		mimeType: "application/pdf",
		size: 2e5,
		uploadedAt: hoursAgo(opts.h ?? 8),
		isSample: true,
		issuer: opts.issuer ?? "not-started",
		check: {
			status: opts.warning ? "warning" : "passed",
			findings,
			extracted,
			detectedKind: kind,
			checkedAt: hoursAgo(opts.h ?? 8)
		}
	};
}
function documents(start) {
	const share = (id, applicationId, kind, status, snapshot, h = 8) => ({
		id,
		applicationId,
		kind,
		required: true,
		status,
		requestedAt: hoursAgo(h + 20),
		dueOn: addDays(start, 9),
		sharedAt: snapshot ? hoursAgo(h) : void 0,
		reviewedAt: status === "approved" ? hoursAgo(h - 1) : void 0,
		snapshot
	});
	return [
		share("d-ay-adm", "app-ayesha", "admission-letter", "shared", snap("admission-letter", "CPUT_admission_Ayesha.pdf", [
			{
				label: "Institution",
				value: "Cape Peninsula University of Technology"
			},
			{
				label: "Qualification",
				value: "Diploma in ICT: Applications Development"
			},
			{
				label: "Admission type",
				value: "Provisional, subject to final NSC results"
			}
		], {
			warning: "Provisional offer. Ask for the final letter after NSC results if needed.",
			h: 6
		}), 6),
		share("d-ay-res", "app-ayesha", "latest-results", "shared", snap("latest-results", "Grade12_June_results_Ayesha.pdf", [{
			label: "Results",
			value: "Grade 12 June examination"
		}, {
			label: "Estimated APS",
			value: "36"
		}], {
			issuer: "verified",
			h: 6
		}), 6),
		share("d-ay-inc", "app-ayesha", "income-proof", "requested"),
		share("d-le-adm", "app-lerato", "admission-letter", "requested"),
		share("d-ka-adm", "app-kagiso", "admission-letter", "approved", snap("admission-letter", "UP_admission_Kagiso.pdf", [{
			label: "Institution",
			value: "University of Pretoria"
		}], {
			issuer: "verified",
			h: 4800
		}), 4800),
		share("d-ka-sem", "app-kagiso", "semester-results", "approved", snap("semester-results", "UP_semester1_record_Kagiso.pdf", [{
			label: "Average",
			value: "71%"
		}, {
			label: "Credits",
			value: "60 of 64"
		}], {
			issuer: "verified",
			h: 1440
		}), 1440),
		share("d-za-adm", "app-zanele", "admission-letter", "approved", snap("admission-letter", "NMU_admission_Zanele.pdf", [{
			label: "Institution",
			value: "Nelson Mandela University"
		}], {
			issuer: "verified",
			h: 4752
		}), 4752),
		share("d-za-sem", "app-zanele", "semester-results", "approved", snap("semester-results", "NMU_semester1_record_Zanele.pdf", [{
			label: "Average",
			value: "64%"
		}, {
			label: "Credits",
			value: "56 of 64"
		}], {
			issuer: "verified",
			h: 1392
		}), 1392)
	];
}
function decisions() {
	const d = (studentId, outcome, reason, h = 48) => ({
		studentId,
		fundId: "fund-ridge-dev",
		outcome,
		reason,
		at: hoursAgo(h)
	});
	return { [DEMO_SPONSOR_ID]: [
		d("stu-kagiso", "positive", void 0, 4824),
		d("stu-zanele", "positive", void 0, 4776),
		d("stu-lerato", "positive", void 0, 21),
		d("stu-sipho", "positive", void 0, 30),
		d("stu-pieter", "negative", "Gap is larger than one award can cover", 40),
		d("stu-mpho", "negative", "Field is outside this fund’s focus", 44)
	] };
}
function events() {
	return [
		{
			id: "e1",
			at: hoursAgo(72),
			audience: "student",
			studentId: "stu-tatenda",
			text: "Blocked a fee request from QuickBursary SA and suspended the sender",
			kind: "safety"
		},
		{
			id: "e2",
			at: hoursAgo(20),
			audience: "sponsor",
			sponsorId: DEMO_SPONSOR_ID,
			text: "Offer of R58,000 sent to Lerato",
			kind: "offer"
		},
		{
			id: "e3",
			at: hoursAgo(6),
			audience: "sponsor",
			sponsorId: DEMO_SPONSOR_ID,
			text: "Ayesha shared her admission letter and results",
			kind: "document"
		}
	];
}
function createPlatformSeed(start = todayISO()) {
	return {
		version: 1,
		sponsors: sponsors(),
		funds: funds(start),
		pool: pool(),
		applications: applications(),
		messages: messages(),
		documents: documents(start),
		decisions: decisions(),
		events: events()
	};
}
// src/intelligence/moderation.ts
/**
* Message safety screen. Runs on every message before it is delivered.
* - Contact details are removed so conversations stay on the platform
*   (where they are logged, and a guardian can see them for under-18s).
* - Requests for money from a sponsor are the most common bursary scam in
*   South Africa; they are blocked and the sponsor is suspended for review.
*/
var RULES = [
	{
		kind: "contact-details",
		label: "Phone number",
		test: /(\+27|\b0)[\s-]?[1-8]\d[\s-]?\d{3}[\s-]?\d{4}\b/
	},
	{
		kind: "contact-details",
		label: "Email address",
		test: /[\w.+-]+@[\w-]+\.[\w.-]+/
	},
	{
		kind: "off-platform",
		label: "Request to move off the platform",
		test: /\b(whats\s?app|telegram|call me|sms me|dm me|meet (me|up)|my number|your number|text me)\b/i
	},
	{
		kind: "bank-details",
		label: "Bank or card details",
		test: /\b(account (no|number)|acc no|branch code|card number|cvv|pin\b|otp\b|banking password)/i
	},
	{
		kind: "payment-request",
		label: "Request for payment",
		test: /\b(admin(istration)? fee|processing fee|application fee|registration fee to us|deposit|pay (us|me|a fee|r\s?\d+)|send (money|r\s?\d+|airtime|cash)|e-?wallet|cash send|voucher)\b/i
	}
];
function screenMessage(text, from) {
	const flags = [];
	for (const r of RULES) if (r.test.test(text) && !flags.some((f) => f.label === r.label)) flags.push({
		kind: r.kind,
		label: r.label
	});
	const blocked = flags.some((f) => f.kind === "payment-request" || f.kind === "bank-details") && from === "sponsor";
	let cleanText = text;
	cleanText = cleanText.replace(/(\+27|\b0)[\s-]?[1-8]\d[\s-]?\d{3}[\s-]?\d{4}\b/g, "[number removed]");
	cleanText = cleanText.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email removed]");
	return {
		flags,
		blocked,
		cleanText,
		suspendSender: blocked
	};
}
// src/utils/format.ts
var zar = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 });
/** Formats a rand amount as R12,500 (comma thousands, as used in the brief). */
function formatZAR(value) {
	const rounded = Math.round(value);
	return `${rounded < 0 ? "−" : ""}R${zar.format(Math.abs(rounded)).replace(/[\s  ]/g, ",")}`;
}
// src/utils/createState.ts
function makeId(prefix = "id") {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
// src/platform/platformReducer.ts
var now = () => (/* @__PURE__ */ new Date()).toISOString();
function event(state, e) {
	return {
		...state,
		events: [{
			...e,
			id: makeId("ev"),
			at: now()
		}, ...state.events].slice(0, 80)
	};
}
function sponsorOfFund(state, fundId) {
	const fund = state.funds.find((f) => f.id === fundId);
	return {
		fund,
		sponsor: fund ? state.sponsors.find((s) => s.id === fund.sponsorId) : void 0
	};
}
function upsertApplication(state, fundId, studentId, patch, initiatedBy) {
	const existing = state.applications.find((a) => a.fundId === fundId && a.studentId === studentId);
	if (existing) {
		const app = {
			...existing,
			...patch,
			updatedAt: now()
		};
		return {
			state: {
				...state,
				applications: state.applications.map((a) => a.id === existing.id ? app : a)
			},
			app
		};
	}
	const app = {
		id: makeId("app"),
		fundId,
		studentId,
		initiatedBy,
		createdAt: now(),
		updatedAt: now(),
		...patch
	};
	return {
		state: {
			...state,
			applications: [app, ...state.applications]
		},
		app
	};
}
function decide(state, sponsorId, d) {
	const list = (state.decisions[sponsorId] ?? []).filter((x) => !(x.studentId === d.studentId && x.fundId === d.fundId));
	return {
		...state,
		decisions: {
			...state.decisions,
			[sponsorId]: [...list, {
				...d,
				at: now()
			}]
		}
	};
}
function addMessage(state, m) {
	return {
		...state,
		messages: [...state.messages, {
			...m,
			id: makeId("msg"),
			at: now()
		}]
	};
}
function platformReducer(state, action) {
	switch (action.type) {
		case "hydrate": return action.state;
		case "reset": return createPlatformSeed();
		case "expressInterest": {
			const { fund, sponsor } = sponsorOfFund(state, action.fundId);
			if (!fund || !sponsor) return state;
			const r = upsertApplication(state, action.fundId, action.studentId, { status: "interested" }, action.by);
			return event(addMessage(r.state, {
				applicationId: r.app.id,
				from: "system",
				text: `${action.studentName} shared a verified, anonymised profile with ${sponsor.name}${action.by === "agent" ? " (prepared by the assistant, approved by the student)" : ""}.`
			}), {
				audience: "sponsor",
				sponsorId: sponsor.id,
				kind: "application",
				text: `${action.studentName} expressed interest in ${fund.name}`
			});
		}
		case "shortlist": {
			const { fund, sponsor } = sponsorOfFund(state, action.fundId);
			if (!fund || !sponsor) return state;
			let next = decide(upsertApplication(state, action.fundId, action.studentId, { status: "shortlisted" }, "sponsor").state, sponsor.id, {
				studentId: action.studentId,
				fundId: action.fundId,
				outcome: "positive"
			});
			next = event(next, {
				audience: "student",
				studentId: action.studentId,
				kind: "application",
				text: `${sponsor.name} shortlisted you for ${fund.name}`
			});
			return event(next, {
				audience: "sponsor",
				sponsorId: sponsor.id,
				kind: "application",
				text: `Shortlisted ${action.studentName}`
			});
		}
		case "declineCandidate": {
			const { fund, sponsor } = sponsorOfFund(state, action.fundId);
			if (!fund || !sponsor) return state;
			let next = state;
			if (state.applications.some((a) => a.fundId === action.fundId && a.studentId === action.studentId)) next = upsertApplication(state, action.fundId, action.studentId, {
				status: "declined-by-sponsor",
				declineReason: action.reason
			}, "sponsor").state;
			return decide(next, sponsor.id, {
				studentId: action.studentId,
				fundId: action.fundId,
				outcome: "negative",
				reason: action.reason
			});
		}
		case "sendOffer": {
			const { fund, sponsor } = sponsorOfFund(state, action.fundId);
			if (!fund || !sponsor || sponsor.status !== "active") return state;
			const r = upsertApplication(state, action.fundId, action.studentId, {
				status: "offered",
				amount: action.amount,
				offerNote: action.note
			}, "sponsor");
			let next = decide(r.state, sponsor.id, {
				studentId: action.studentId,
				fundId: action.fundId,
				outcome: "positive"
			});
			const kinds = [.../* @__PURE__ */ new Set(["admission-letter", ...action.requiredDocs])];
			const due = addDays(todayISO(), 14);
			next = {
				...next,
				documents: [...next.documents.filter((d) => d.applicationId !== r.app.id), ...kinds.map((kind) => ({
					id: makeId("doc"),
					applicationId: r.app.id,
					kind,
					required: true,
					status: "requested",
					requestedAt: now(),
					dueOn: due
				}))]
			};
			next = addMessage(next, {
				applicationId: r.app.id,
				from: "system",
				text: `${sponsor.name} offered ${formatZAR(action.amount)} from ${fund.name}. Documents needed before payment: ${kinds.map((k) => DOCUMENT_INFO[k].label.toLowerCase()).join(", ")}. Paid straight to the institution.`
			});
			if (action.note.trim()) {
				const screen = screenMessage(action.note, "sponsor");
				next = addMessage(next, {
					applicationId: r.app.id,
					from: "sponsor",
					text: screen.blocked ? action.note : screen.cleanText,
					flags: screen.flags,
					blocked: screen.blocked
				});
			}
			next = event(next, {
				audience: "student",
				studentId: action.studentId,
				kind: "offer",
				text: `New offer: ${formatZAR(action.amount)} from ${sponsor.name}`
			});
			return event(next, {
				audience: "sponsor",
				sponsorId: sponsor.id,
				kind: "offer",
				text: `Offer of ${formatZAR(action.amount)} sent to ${action.studentName}`
			});
		}
		case "respondOffer": {
			const app = state.applications.find((a) => a.id === action.applicationId);
			if (!app || app.status !== "offered") return state;
			const { fund, sponsor } = sponsorOfFund(state, app.fundId);
			const status = action.accept ? "accepted" : "declined-by-student";
			let next = {
				...state,
				applications: state.applications.map((a) => a.id === app.id ? {
					...a,
					status,
					agreement: action.accept ? action.agreement : void 0,
					updatedAt: now()
				} : a)
			};
			next = addMessage(next, {
				applicationId: app.id,
				from: "system",
				text: action.accept ? `${action.studentName} accepted and signed the funding agreement in the app${action.agreement?.guardianName ? `, co-signed by ${action.agreement.guardianName}` : ""}. Next: documents.` : `${action.studentName} declined the offer.`
			});
			return event(next, {
				audience: "sponsor",
				sponsorId: sponsor?.id,
				kind: "offer",
				text: `${action.studentName} ${action.accept ? "accepted" : "declined"} your ${formatZAR(app.amount ?? 0)} offer${fund ? ` (${fund.name})` : ""}`
			});
		}
		case "payInstitution": {
			const app = state.applications.find((a) => a.id === action.applicationId);
			if (!app || app.status !== "approved") return state;
			const { sponsor } = sponsorOfFund(state, app.fundId);
			const ref = `${(sponsor?.name ?? "PSA").slice(0, 3).toUpperCase()}-${(/* @__PURE__ */ new Date()).getFullYear().toString().slice(2)}-${Math.floor(1e3 + Math.random() * 8999)}`;
			let next = {
				...state,
				applications: state.applications.map((a) => a.id === app.id ? {
					...a,
					status: "paid",
					paymentReference: ref,
					updatedAt: now()
				} : a)
			};
			next = addMessage(next, {
				applicationId: app.id,
				from: "system",
				text: `${formatZAR(app.amount ?? 0)} paid to the ${action.institution} student fee account. Reference ${ref}.`
			});
			next = event(next, {
				audience: "student",
				studentId: app.studentId,
				kind: "payment",
				text: `${formatZAR(app.amount ?? 0)} paid to your ${action.institution} fee account`
			});
			return event(next, {
				audience: "sponsor",
				sponsorId: sponsor?.id,
				kind: "payment",
				text: `Paid ${formatZAR(app.amount ?? 0)} to ${action.institution} for ${action.studentName}`
			});
		}
		case "sendMessage": {
			const app = state.applications.find((a) => a.id === action.applicationId);
			if (!app || !action.text.trim()) return state;
			const { sponsor } = sponsorOfFund(state, app.fundId);
			const screen = screenMessage(action.text, action.from);
			let next = addMessage(state, {
				applicationId: app.id,
				from: action.from,
				text: screen.blocked ? action.text : screen.cleanText,
				flags: screen.flags.length ? screen.flags : void 0,
				blocked: screen.blocked
			});
			if (screen.suspendSender && sponsor) {
				next = {
					...next,
					sponsors: next.sponsors.map((s) => s.id === sponsor.id ? {
						...s,
						status: "suspended",
						suspendedReason: "Asked a student for payment. Suspended pending review."
					} : s)
				};
				next = addMessage(next, {
					applicationId: app.id,
					from: "system",
					text: `A message asking for payment was blocked. ${sponsor.name} is suspended while the safety team reviews it.`
				});
				next = event(next, {
					audience: "all",
					studentId: app.studentId,
					sponsorId: sponsor.id,
					kind: "safety",
					text: `Blocked a payment request and suspended ${sponsor.name}`
				});
			} else next = event(next, {
				audience: action.from === "student" ? "sponsor" : "student",
				studentId: app.studentId,
				sponsorId: sponsor?.id,
				kind: "message",
				text: action.from === "student" ? "New message from a student" : `New message from ${sponsor?.name ?? "a sponsor"}`
			});
			return next;
		}
		case "shareDocument": {
			const share = state.documents.find((d) => d.id === action.shareId);
			if (!share) return state;
			const app = state.applications.find((a) => a.id === share.applicationId);
			const { sponsor } = app ? sponsorOfFund(state, app.fundId) : { sponsor: void 0 };
			let next = {
				...state,
				documents: state.documents.map((d) => d.id === share.id ? {
					...d,
					status: "shared",
					sharedAt: now(),
					snapshot: action.snapshot,
					reviewNote: void 0
				} : d)
			};
			next = addMessage(next, {
				applicationId: share.applicationId,
				from: "system",
				text: `${action.studentName} shared their ${DOCUMENT_INFO[share.kind].label.toLowerCase()} in the app.`
			});
			return event(next, {
				audience: "sponsor",
				sponsorId: sponsor?.id,
				kind: "document",
				text: `${action.studentName} shared a ${DOCUMENT_INFO[share.kind].label.toLowerCase()}`
			});
		}
		case "reviewDocument": {
			const share = state.documents.find((d) => d.id === action.shareId);
			if (!share || share.status !== "shared") return state;
			const app = state.applications.find((a) => a.id === share.applicationId);
			const status = action.approve ? "approved" : "resubmit";
			let next = {
				...state,
				documents: state.documents.map((d) => d.id === share.id ? {
					...d,
					status,
					reviewedAt: now(),
					reviewNote: action.note,
					dueOn: action.approve ? d.dueOn : addDays(todayISO(), 7)
				} : d)
			};
			const label = DOCUMENT_INFO[share.kind].label.toLowerCase();
			next = addMessage(next, {
				applicationId: share.applicationId,
				from: "system",
				text: action.approve ? `Sponsor approved the ${label}.` : `Sponsor asked for a new ${label}: ${action.note || "see the request for details"}.`
			});
			return event(next, {
				audience: "student",
				studentId: app?.studentId,
				kind: "document",
				text: action.approve ? `Your ${label} was approved` : `Please upload a new ${label}`
			});
		}
		case "requestDocument": {
			const app = state.applications.find((a) => a.id === action.applicationId);
			if (!app) return state;
			if (state.documents.some((d) => d.applicationId === app.id && d.kind === action.kind && d.status !== "approved")) return state;
			const share = {
				id: makeId("doc"),
				applicationId: app.id,
				kind: action.kind,
				note: action.note,
				required: action.required,
				status: "requested",
				requestedAt: now(),
				dueOn: addDays(todayISO(), 14)
			};
			let next = {
				...state,
				documents: [...state.documents, share]
			};
			next = addMessage(next, {
				applicationId: app.id,
				from: "system",
				text: `Sponsor requested a ${DOCUMENT_INFO[action.kind].label.toLowerCase()} in the app${action.note ? `: ${action.note}` : ""}.`
			});
			return event(next, {
				audience: "student",
				studentId: app.studentId,
				kind: "document",
				text: `New document request: ${DOCUMENT_INFO[action.kind].label}`
			});
		}
		case "remindDocument": {
			const share = state.documents.find((d) => d.id === action.shareId);
			const app = share ? state.applications.find((a) => a.id === share.applicationId) : void 0;
			if (!share || !app) return state;
			const label = DOCUMENT_INFO[share.kind].label.toLowerCase();
			return event(addMessage(state, {
				applicationId: app.id,
				from: "system",
				text: `Reminder from your sponsor: please share your ${label} in the app.`
			}), {
				audience: "student",
				studentId: app.studentId,
				kind: "document",
				text: `Reminder: share your ${label}`
			});
		}
		case "confirmShareIssuer": return {
			...state,
			documents: state.documents.map((d) => d.id === action.shareId && d.snapshot ? {
				...d,
				snapshot: {
					...d.snapshot,
					issuer: action.ok ? "verified" : "failed"
				}
			} : d)
		};
		case "approveFunding": {
			const app = state.applications.find((a) => a.id === action.applicationId);
			if (!app || app.status !== "accepted") return state;
			if (state.documents.filter((d) => d.applicationId === app.id && d.required).some((d) => d.status !== "approved")) return state;
			const { sponsor } = sponsorOfFund(state, app.fundId);
			let next = {
				...state,
				applications: state.applications.map((a) => a.id === app.id ? {
					...a,
					status: "approved",
					updatedAt: now()
				} : a)
			};
			next = addMessage(next, {
				applicationId: app.id,
				from: "system",
				text: "All documents approved. Funding approved and payment to the institution is being scheduled."
			});
			return event(next, {
				audience: "student",
				studentId: app.studentId,
				sponsorId: sponsor?.id,
				kind: "offer",
				text: `Funding approved by ${sponsor?.name ?? "your sponsor"}`
			});
		}
		case "saveFund": {
			const exists = state.funds.some((f) => f.id === action.fund.id);
			return event({
				...state,
				funds: exists ? state.funds.map((f) => f.id === action.fund.id ? action.fund : f) : [action.fund, ...state.funds]
			}, {
				audience: "all",
				sponsorId: action.fund.sponsorId,
				kind: "fund",
				text: exists ? `Updated ${action.fund.name}` : `New fund published: ${action.fund.name}`
			});
		}
		case "closeFund": return {
			...state,
			funds: state.funds.map((f) => f.id === action.fundId ? {
				...f,
				status: "closed"
			} : f)
		};
		case "registerSponsor": return {
			...state,
			sponsors: [action.sponsor, ...state.sponsors.filter((s) => s.id !== action.sponsor.id)]
		};
		case "setSponsorCheck": return {
			...state,
			sponsors: state.sponsors.map((s) => s.id === action.sponsorId ? {
				...s,
				verification: {
					...s.verification,
					[action.key]: {
						...action.item,
						updatedAt: now()
					}
				}
			} : s)
		};
		case "publishCandidate": return {
			...state,
			pool: [{
				...action.profile,
				isLive: true
			}, ...state.pool.filter((p) => p.id !== action.profile.id)]
		};
		default: return state;
	}
}
// src/platform/project.ts
/**
* What one signed-in account may read from the shared marketplace. The server
* sends only this, so a browser never holds other people's applications,
* messages or documents.
*
* - Everyone: sponsors (public organisation info) and funds.
* - Student: their own applications and everything attached to them, events
*   addressed to them or to all.
* - Sponsor: the anonymised candidate pool, applications to their own funds and
*   everything attached to those, their own decisions and events.
* - Signed out: sponsors and open funds only.
*/
function projectFor(state, session) {
	const sponsors = state.sponsors.map(({ registrationNumber, ...s }) => ({
		...s,
		registrationNumber: session?.role === "sponsor" && session.userId === s.id ? registrationNumber : ""
	}));
	const base = {
		...state,
		sponsors,
		pool: [],
		applications: [],
		messages: [],
		documents: [],
		decisions: {},
		events: []
	};
	if (!session) return {
		...base,
		funds: state.funds.filter((f) => f.status === "open")
	};
	if (session.role === "student") {
		const apps = state.applications.filter((a) => a.studentId === session.userId);
		const ids = new Set(apps.map((a) => a.id));
		return {
			...base,
			pool: state.pool.filter((p) => p.id === session.userId),
			applications: apps,
			messages: state.messages.filter((m) => ids.has(m.applicationId)),
			documents: state.documents.filter((d) => ids.has(d.applicationId)),
			events: state.events.filter((e) => e.audience === "all" || e.audience === "student" && e.studentId === session.userId)
		};
	}
	const ownFunds = new Set(state.funds.filter((f) => f.sponsorId === session.userId).map((f) => f.id));
	const apps = state.applications.filter((a) => ownFunds.has(a.fundId));
	const ids = new Set(apps.map((a) => a.id));
	return {
		...base,
		pool: state.pool,
		applications: apps,
		messages: state.messages.filter((m) => ids.has(m.applicationId)),
		documents: state.documents.filter((d) => ids.has(d.applicationId)),
		decisions: state.decisions[session.userId] ? { [session.userId]: state.decisions[session.userId] } : {},
		events: state.events.filter((e) => e.audience === "all" || e.audience === "sponsor" && e.sponsorId === session.userId)
	};
}
export { authorize, createPlatformSeed, isPlatformState, platformReducer, projectFor };
