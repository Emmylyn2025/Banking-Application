import { ParsedQs } from "qs";

/**
 * Generic QueryBuilder for Prisma
 * T represents the Prisma Args type for the specific model (e.g., Prisma.UserFindManyArgs)
 */
export class QueryBuilder<T = any> {
  public query: any;
  private queryString: ParsedQs;

  constructor(queryString: ParsedQs) {
    this.queryString = queryString;
    this.query = {};
  }

  /**
   * Filters the query based on allowed fields and operators (gt, gte, lt, lte)
   */
  filter(allowedFields: string[]) {
  const { page, sort, limit, fields, ...filters } = this.queryString;
  const where: any = {};

  for (const key in filters) {
    if (allowedFields.includes(key)) {
      const value = filters[key];

      // helper to convert strings to proper types
      const parseValue = (val: any) => {
        // 1. Handle Booleans
        if (val === 'true') return true;
        if (val === 'false') return false;

        // 2. Handle Numbers (only if it's a valid number string)
        if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
          return Number(val);
        }

        // 3. Handle Dates (basic ISO check)
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
          const date = new Date(val);
          if (!isNaN(date.getTime())) return date;
        }

        return val;
      };

      if (typeof value === "object" && value !== null) {
        where[key] = {};
        for (const operator in value as object) {
          const cleanOp = operator.replace("$", "");
          // Convert the nested value (e.g., the "100" in price[gte]=100)
          where[key][cleanOp] = parseValue((value as any)[operator]);
        }
      } else {
        // Convert direct value (e.g., the "true" in isActive=true)
        where[key] = parseValue(value);
      }
    }
  }

  this.query.where = where;
  return this;
}

  /**
   * Handles multi-field sorting: ?sort=-createdAt,name
   */
  sort(allowedFields: string[]) {
    const { sort } = this.queryString;

    if (sort && typeof sort === "string") {
      const sortFields = sort.split(",");

      // 3. Logic fix: Correctly filter and map the fields
      this.query.orderBy = sortFields
        .filter((field) => {
          const cleanField = field.startsWith("-") ? field.substring(1) : field;
          return allowedFields.includes(cleanField);
        })
        .map((field) => {
          if (field.startsWith("-")) {
            return { [field.substring(1)]: "desc" };
          }
          return { [field]: "asc" };
        });
    } else {
      // Default sort if none provided
      this.query.orderBy = { id: "desc" };
    }

    return this;
  }

  /**
   * Selects specific fields: ?fields=name,email
   */
  limitFields(allowedFields: string[]) {
    const { fields } = this.queryString;
    const select: any = {};

    // 4. Logic fix: Combined logic to ensure 'password' or internal fields are never leaked
    if (fields && typeof fields === "string") {
      const fieldList = fields.split(",");
      
      fieldList.forEach((f) => {
        if (allowedFields.includes(f) && f !== "password") {
          select[f] = true;
        }
      });
    }

    // If no specific fields requested, or list was empty, use allowedFields minus sensitive ones
    if (Object.keys(select).length === 0) {
      allowedFields.forEach((f) => {
        if (f !== "password") select[f] = true;
      });
    }

    this.query.select = select;
    return this;
  }

  /**
   * Handles pagination with skip and take
   */
  paginate() {
    const page = Math.max(Number(this.queryString.page) || 1, 1);
    const limit = Math.max(Number(this.queryString.limit) || 10, 1);

    const skip = (page - 1) * limit;

    this.query.take = limit;
    this.query.skip = skip;

    return this;
  }

  /**
   * Final getter to return the built object for Prisma
   */
  build(): T {
    return this.query as T;
  }
}

export default QueryBuilder;