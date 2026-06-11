import * as yup from 'yup';

export const patientSchema = yup.object({
  lastName: yup.string().required('Last name is required'),
  firstName: yup.string().required('First name is required'),
  middleName: yup.string(),
  gender: yup.string().required('Gender is required').oneOf(['Male', 'Female'], 'Invalid gender'),
  birthdate: yup
    .date()
    .required('Birthdate is required')
    .max(new Date(), 'Birthdate cannot be in the future')
    .transform((value, originalValue) => {
      // If it's already a valid date, return it
      if (value instanceof Date && !isNaN(value.getTime())) {
        return value;
      }
      // Parse string date to avoid timezone issues
      if (typeof originalValue === 'string') {
        const [year, month, day] = originalValue.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return value;
    }),
  birthPlace: yup.string().required('Birth place is required'),
  occupation: yup.string().required('Occupation is required'),
  civilStatus: yup.string().required('Civil status is required').oneOf(['Single', 'Married', 'Widowed', 'Separated'], 'Invalid civil status'),
  street: yup.string().required('Street is required'),
  barangay: yup.string().required('Barangay is required'),
  town: yup.string().required('Town is required'),
  provinceCity: yup.string().required('Province/City is required'),
  zipCode: yup.string().required('Zip code is required').matches(/^\d{4}$/, 'Zip code must be 4 digits'),
  country: yup.string().required('Country is required'),
  mobileNumber: yup.string().required('Mobile number is required').matches(/^(09|\+639)\d{9}$/, 'Invalid mobile number format'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  fatherName: yup.string().optional(),
  motherName: yup.string().optional(),
  validId: yup.mixed().nullable(),
});

export type PatientFormData = yup.InferType<typeof patientSchema>;
