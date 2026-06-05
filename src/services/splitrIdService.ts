import prisma from "../utils/prisma";

export interface splitrIdResult {
  success: boolean;
  splitrId?: string;
  error?: string;
}

export class SplitrIdService {
  private prisma = prisma;

  /**
   * Generate a splitr ID using the database function
   * @param prefix - The prefix for the ID (e.g., 'LPM', 'LPB', 'LPL', 'LPP')
   * @returns Promise<splitrIdResult>
   */
  async generatesplitrId(prefix: string): Promise<splitrIdResult> {
    try {
      // Validate prefix
      if (!prefix || prefix.length > 10) {
        return {
          success: false,
          error: "Invalid prefix. Must be 1-10 characters long.",
        };
      }

      // Call the database function
      const result = await this.prisma.$queryRaw<[{ splitrId: string }]>`
        SELECT generate_splitr_id(${prefix}) as splitrId
      `;

      if (result && result.length > 0) {
        return {
          success: true,
          splitrId: result[0].splitrId,
        };
      }

      return {
        success: false,
        error: "Failed to generate splitr ID",
      };
    } catch (error) {
      console.error("Error generating splitr ID:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get the next sequence number for a given prefix and month
   * @param prefix - The prefix for the ID
   * @param yearMonth - The year-month in YYMM format (optional, defaults to current month)
   * @returns Promise<number | null>
   */
  async getNextSequence(
    prefix: string,
    yearMonth?: string
  ): Promise<number | null> {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const currentMonth = (new Date().getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const targetYearMonth = yearMonth || `${currentYear}${currentMonth}`;

      const result = await this.prisma.$queryRaw<[{ seq: number }]>`
        SELECT seq FROM splitr_sequence 
        WHERE prefix = ${prefix} AND \`year_month\` = ${targetYearMonth}
      `;

      return result && result.length > 0 ? result[0].seq : null;
    } catch (error) {
      console.error("Error getting next sequence:", error);
      return null;
    }
  }

  /**
   * Get all sequences for a prefix
   * @param prefix - The prefix to query
   * @returns Promise<Array<{yearMonth: string, seq: number}>>
   */
  async getSequencesForPrefix(
    prefix: string
  ): Promise<Array<{ yearMonth: string; seq: number }>> {
    try {
      const result = await this.prisma.$queryRaw<
        Array<{ year_month: string; seq: number }>
      >`
        SELECT \`year_month\`, seq FROM splitr_sequence 
        WHERE prefix = ${prefix}
        ORDER BY \`year_month\` DESC
      `;

      return result.map((row) => ({
        yearMonth: row.year_month,
        seq: row.seq,
      }));
    } catch (error) {
      console.error("Error getting sequences for prefix:", error);
      return [];
    }
  }

  /**
   * Validate a splitr ID format
   * @param splitrId - The ID to validate
   * @returns boolean
   */
  validatesplitrId(splitrId: string): boolean {
    // Format: PREFIX-YYMM-NNNNNN
    const regex = /^[A-Z]{2,10}-\d{4}-\d{6}$/;
    return regex.test(splitrId);
  }

  /**
   * Parse a splitr ID to extract components
   * @param splitrId - The ID to parse
   * @returns Object with prefix, yearMonth, and sequence, or null if invalid
   */
  parsesplitrId(
    splitrId: string
  ): { prefix: string; yearMonth: string; sequence: number } | null {
    if (!this.validatesplitrId(splitrId)) {
      return null;
    }

    const parts = splitrId.split("-");
    if (parts.length !== 3) {
      return null;
    }

    return {
      prefix: parts[0],
      yearMonth: parts[1],
      sequence: parseInt(parts[2], 10),
    };
  }

  /**
   * Get statistics for splitr ID generation
   * @returns Promise<Object>
   */
  async getStatistics(): Promise<{
    totalPrefixes: number;
    totalSequences: number;
    prefixes: Array<{ prefix: string; count: number }>;
  }> {
    try {
      const prefixStats = await this.prisma.$queryRaw<
        Array<{ prefix: string; count: bigint }>
      >`
        SELECT prefix, COUNT(*) as count 
        FROM splitr_sequence 
        GROUP BY prefix
        ORDER BY count DESC
      `;

      const totalSequences = await this.prisma.$queryRaw<[{ total: bigint }]>`
        SELECT SUM(seq - 100000) as total FROM splitr_sequence
      `;

      return {
        totalPrefixes: prefixStats.length,
        totalSequences: Number(totalSequences[0]?.total || 0),
        prefixes: prefixStats.map((stat) => ({
          prefix: stat.prefix,
          count: Number(stat.count),
        })),
      };
    } catch (error) {
      console.error("Error getting statistics:", error);
      return {
        totalPrefixes: 0,
        totalSequences: 0,
        prefixes: [],
      };
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const splitrIdService = new SplitrIdService();
