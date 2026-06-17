import axios, { Method } from "axios";
import { PersonaInquiryStatus } from "@prisma/client";
import prisma from "../utils/prisma";

const PERSONA_API_BASE_URL =
  process.env.PERSONA_API_BASE_URL || "https://api.withpersona.com/api/v1";
const PERSONA_API_KEY = process.env.PERSONA_API_KEY;
const PERSONA_INQUIRY_TEMPLATE_ID = process.env.PERSONA_INQUIRY_TEMPLATE_ID;

interface PersonaApiRequestOptions {
  method: Method;
  endpoint: string; // e.g. "/inquiries"
  data?: any;
  params?: any;
  headers?: Record<string, string>;
}

function requirePersonaApiKey() {
  if (!PERSONA_API_KEY || PERSONA_API_KEY.trim().length === 0) {
    throw new Error("PERSONA_API_KEY is not set");
  }
  return PERSONA_API_KEY;
}

function mapPersonaInquiryStatus(status?: string): PersonaInquiryStatus {
  const normalized = status?.toLowerCase();

  if (normalized === "completed" || normalized === "approved") {
    return PersonaInquiryStatus.Completed;
  }

  if (normalized === "failed" || normalized === "declined") {
    return PersonaInquiryStatus.Failed;
  }

  if (normalized === "pending") {
    return PersonaInquiryStatus.Pending;
  }
  if (normalized === "expired") {
    return PersonaInquiryStatus.Expired;
  }

  return PersonaInquiryStatus.Created;
}

type PersonaInquiryFields = Record<string, { value?: string | null } | undefined>;

function getPersonaFieldValue(
  fields: PersonaInquiryFields | undefined,
  key: string
): string | undefined {
  const value = fields?.[key]?.value;
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  return value;
}

function mapPersonaFieldsToBuyerData(fields: PersonaInquiryFields | undefined) {
  const street1 = getPersonaFieldValue(fields, "address_street_1");
  const street2 = getPersonaFieldValue(fields, "address_street_2");
  const province = getPersonaFieldValue(fields, "address_subdivision");

  const data: Record<string, string | boolean> = {
    isVerified: true,
    status: "verified",
  };

  const firstName = getPersonaFieldValue(fields, "name_first");
  if (firstName) data.firstName = firstName;

  const lastName = getPersonaFieldValue(fields, "name_last");
  if (lastName) data.lastName = lastName;

  const dob = getPersonaFieldValue(fields, "birthdate");
  if (dob) data.DOB = dob;

  const email = getPersonaFieldValue(fields, "email_address");
  if (email) data.email = email;

  const phoneNumber = getPersonaFieldValue(fields, "phone_number");
  if (phoneNumber) data.phoneNumber = phoneNumber;

  if (street1) {
    data.address = street2 ? `${street1}, ${street2}` : street1;
  }

  if (street2) data.houseNo = street2;

  const city = getPersonaFieldValue(fields, "address_city");
  if (city) data.city = city;

  if (province) {
    data.province = province;
    data.state = province;
  }

  const postalCode = getPersonaFieldValue(fields, "address_postal_code");
  if (postalCode) data.postalCode = postalCode;

  const idType = getPersonaFieldValue(fields, "identification_class");
  if (idType) data.idType = idType;

  const idNumber = getPersonaFieldValue(fields, "identification_number");
  if (idNumber) data.idNumber = idNumber;

  const sinNumber = getPersonaFieldValue(fields, "social_security_number");
  if (sinNumber) data.sinNumber = sinNumber;

  return data;
}

async function personaApiRequest<T = any>({
  method,
  endpoint,
  data,
  params,
  headers = {},
}: PersonaApiRequestOptions): Promise<T> {
  try {
    const response = await axios({
      method,
      url: `${PERSONA_API_BASE_URL}${endpoint}`,
      data,
      params,
      headers: {
        Authorization: `Bearer ${requirePersonaApiKey()}`,
        "Content-Type": "application/json",
        accept: "application/json",
        ...headers,
      },
    });

    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
}

export class PersonaInquiryService {
  async createInquiry(inquiryTemplateId?: string) {
    const templateId = inquiryTemplateId || PERSONA_INQUIRY_TEMPLATE_ID;
    if (!templateId) {
      throw new Error("PERSONA_INQUIRY_TEMPLATE_ID is not set");
    }

    return personaApiRequest({
      method: "POST",
      endpoint: "/inquiries",
      data: {
        data: {
          attributes: {
            "inquiry-template-id": templateId,
          },
        },
      },
    });
  }

  async listInquiries() {
    return personaApiRequest({
      method: "GET",
      endpoint: "/inquiries",
    });
  }

  async getInquiry(inquiryId: string) {
    if (!inquiryId) {
      throw new Error("inquiryId is required");
    }

    return personaApiRequest({
      method: "GET",
      endpoint: `/inquiries/${encodeURIComponent(inquiryId)}`,
    });
  }

  async getOrCreateInquiryForBuyer(buyerId: string, inquiryTemplateId?: string) {
    if (!buyerId) {
      throw new Error("buyerId is required");
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const existing = await prisma.personaInquiry.findFirst({
      where: {
        buyerId,
        status: { in: [PersonaInquiryStatus.Created, PersonaInquiryStatus.Pending] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      // check is still active
      // call the persona api to get the inquiry status
      const inquiry = await this.getInquiry(existing.inquiryId);
      if (
        inquiry?.data?.attributes?.status === "completed" ||
        inquiry?.data?.attributes?.status === "pending" ||
        inquiry?.data?.attributes?.status === "created"
      ) {
        return { record: existing, created: false };
      }
      // update the inquiry status
      await prisma.personaInquiry.update({
        where: { id: existing.id },
        data: { status: mapPersonaInquiryStatus(inquiry?.data?.attributes?.status) },
      });
    }

    const templateId = inquiryTemplateId || PERSONA_INQUIRY_TEMPLATE_ID;
    const personaResponse = await this.createInquiry(templateId);
    const inquiryId = personaResponse?.data?.id;

    if (!inquiryId) {
      throw new Error("Persona API did not return an inquiry id");
    }

    const record = await prisma.personaInquiry.create({
      data: {
        inquiryId,
        inquiryTemplateId: templateId!,
        buyerId,
        status: mapPersonaInquiryStatus(personaResponse?.data?.attributes?.status),
        response: personaResponse,
      },
    });

    return { record, created: true };
  }

  async updateInquiry(inquiryId: string) {
    const inquiryRecord = await prisma.personaInquiry.findUnique({
      where: { inquiryId: inquiryId },
      include: {
        buyer: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!inquiryRecord) {
      throw new Error("Inquiry not found");
    }

    const inquiry = await this.getInquiry(inquiryRecord.inquiryId);
    if (!inquiry?.data?.attributes) {
      throw new Error("Inquiry not found");
    }

    const personaStatus = inquiry.data.attributes.status;
    const personaFields = inquiry.data.attributes.fields as PersonaInquiryFields;

    if (personaStatus === "completed") {
      await prisma.user.update({
        where: { id: inquiryRecord.buyer.userId },
        data: { isVerified: true },
      });

      const buyer = await prisma.buyer.update({
        where: { id: inquiryRecord.buyerId },
        data: mapPersonaFieldsToBuyerData(personaFields),
      });

      const record = await prisma.personaInquiry.update({
        where: { inquiryId },
        data: {
          status: mapPersonaInquiryStatus(personaStatus),
          response: inquiry,
        },
      });

      return {
        success: true,
        message: "Inquiry updated successfully and buyer is verified",
        buyer,
        record,
      };
    }

    await prisma.personaInquiry.update({
      where: { inquiryId },
      data: {
        status: mapPersonaInquiryStatus(personaStatus),
        response: inquiry,
      },
    });
    const buyerData = mapPersonaFieldsToBuyerData(personaFields);
    return {
      success: false,
      message: "Inquiry updated successfully but buyer is not verified",
      buyer: buyerData,
    };
  }
}

export const personaInquiryService = new PersonaInquiryService();
