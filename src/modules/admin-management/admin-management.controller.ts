import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { parsePagination } from '../../common/utils/pagination';
import { AdminManagementService } from './admin-management.service';

const getApprover = (req: Request): { name: string; email: string } | null => {
  if (!req.user?.fullName || !req.user?.email) {
    return null;
  }

  return {
    name: req.user.fullName,
    email: req.user.email
  };
};

export class AdminManagementController {
  static createAdmin = catchAsync(async (req: Request, res: Response) => {
    const admin = await AdminManagementService.createAdmin(req.body);

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin
    });
  });

  static blockAdmin = catchAsync(async (req: Request, res: Response) => {
    const admin = await AdminManagementService.blockAdmin(req.params.adminUserId);

    return res.status(200).json({
      success: true,
      message: 'Admin blocked successfully',
      data: admin
    });
  });

  static unblockAdmin = catchAsync(async (req: Request, res: Response) => {
    const admin = await AdminManagementService.unblockAdmin(req.params.adminUserId);

    return res.status(200).json({
      success: true,
      message: 'Admin unblocked successfully',
      data: admin
    });
  });

  static getCustomers = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const customers = await AdminManagementService.getCustomers(pagination);

    return res.status(200).json({
      success: true,
      meta: customers.meta,
      data: customers.data
    });
  });

  static getBlockedCustomers = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const customers = await AdminManagementService.getBlockedCustomers(pagination);

    return res.status(200).json({
      success: true,
      meta: customers.meta,
      data: customers.data
    });
  });

  static getCustomerById = catchAsync(async (req: Request, res: Response) => {
    const customer = await AdminManagementService.getCustomerById(req.params.customerId);

    return res.status(200).json({
      success: true,
      data: customer
    });
  });

  static blockCustomer = catchAsync(async (req: Request, res: Response) => {
    const customer = await AdminManagementService.blockCustomer(req.params.customerId);

    return res.status(200).json({
      success: true,
      message: 'Customer blocked successfully',
      data: customer
    });
  });

  static unblockCustomer = catchAsync(async (req: Request, res: Response) => {
    const customer = await AdminManagementService.unblockCustomer(req.params.customerId);

    return res.status(200).json({
      success: true,
      message: 'Customer unblocked successfully',
      data: customer
    });
  });

  static getServiceProviders = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const serviceProviders = await AdminManagementService.getServiceProviders(pagination);

    return res.status(200).json({
      success: true,
      meta: serviceProviders.meta,
      data: serviceProviders.data
    });
  });

  static getBlockedServiceProviders = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const serviceProviders = await AdminManagementService.getBlockedServiceProviders(pagination);

    return res.status(200).json({
      success: true,
      meta: serviceProviders.meta,
      data: serviceProviders.data
    });
  });

  static getServiceProviderById = catchAsync(async (req: Request, res: Response) => {
    const serviceProvider = await AdminManagementService.getServiceProviderById(req.params.serviceProviderId);

    return res.status(200).json({
      success: true,
      data: serviceProvider
    });
  });

  static blockServiceProvider = catchAsync(async (req: Request, res: Response) => {
    const serviceProvider = await AdminManagementService.blockServiceProvider(req.params.serviceProviderId);

    return res.status(200).json({
      success: true,
      message: 'Service provider blocked successfully',
      data: serviceProvider
    });
  });

  static unblockServiceProvider = catchAsync(async (req: Request, res: Response) => {
    const serviceProvider = await AdminManagementService.unblockServiceProvider(req.params.serviceProviderId);

    return res.status(200).json({
      success: true,
      message: 'Service provider unblocked successfully',
      data: serviceProvider
    });
  });

  static getVenueProviders = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const venueProviders = await AdminManagementService.getVenueProviders(pagination);

    return res.status(200).json({
      success: true,
      meta: venueProviders.meta,
      data: venueProviders.data
    });
  });

  static getBlockedVenueProviders = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const venueProviders = await AdminManagementService.getBlockedVenueProviders(pagination);

    return res.status(200).json({
      success: true,
      meta: venueProviders.meta,
      data: venueProviders.data
    });
  });

  static getVenueProviderById = catchAsync(async (req: Request, res: Response) => {
    const venueProvider = await AdminManagementService.getVenueProviderById(req.params.venueProviderId);

    return res.status(200).json({
      success: true,
      data: venueProvider
    });
  });

  static blockVenueProvider = catchAsync(async (req: Request, res: Response) => {
    const venueProvider = await AdminManagementService.blockVenueProvider(req.params.venueProviderId);

    return res.status(200).json({
      success: true,
      message: 'Venue provider blocked successfully',
      data: venueProvider
    });
  });

  static unblockVenueProvider = catchAsync(async (req: Request, res: Response) => {
    const venueProvider = await AdminManagementService.unblockVenueProvider(req.params.venueProviderId);

    return res.status(200).json({
      success: true,
      message: 'Venue provider unblocked successfully',
      data: venueProvider
    });
  });

  static getEventPlanners = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const eventPlanners = await AdminManagementService.getEventPlanners(pagination);

    return res.status(200).json({
      success: true,
      meta: eventPlanners.meta,
      data: eventPlanners.data
    });
  });

  static getBlockedEventPlanners = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const eventPlanners = await AdminManagementService.getBlockedEventPlanners(pagination);

    return res.status(200).json({
      success: true,
      meta: eventPlanners.meta,
      data: eventPlanners.data
    });
  });

  static getEventPlannerById = catchAsync(async (req: Request, res: Response) => {
    const eventPlanner = await AdminManagementService.getEventPlannerById(req.params.eventPlannerId);

    return res.status(200).json({
      success: true,
      data: eventPlanner
    });
  });

  static blockEventPlanner = catchAsync(async (req: Request, res: Response) => {
    const eventPlanner = await AdminManagementService.blockEventPlanner(req.params.eventPlannerId);

    return res.status(200).json({
      success: true,
      message: 'Event planner blocked successfully',
      data: eventPlanner
    });
  });

  static unblockEventPlanner = catchAsync(async (req: Request, res: Response) => {
    const eventPlanner = await AdminManagementService.unblockEventPlanner(req.params.eventPlannerId);

    return res.status(200).json({
      success: true,
      message: 'Event planner unblocked successfully',
      data: eventPlanner
    });
  });

  static getAllVenues = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const venues = await AdminManagementService.getAllVenues(pagination);

    return res.status(200).json({
      success: true,
      meta: venues.meta,
      data: venues.data
    });
  });

  static getAllServices = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const services = await AdminManagementService.getAllServices(pagination);

    return res.status(200).json({
      success: true,
      meta: services.meta,
      data: services.data
    });
  });

  static getPendingVenues = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const venues = await AdminManagementService.getPendingVenues(pagination);

    return res.status(200).json({
      success: true,
      meta: venues.meta,
      data: venues.data
    });
  });

  static getPendingServices = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const services = await AdminManagementService.getPendingServices(pagination);

    return res.status(200).json({
      success: true,
      meta: services.meta,
      data: services.data
    });
  });

  static getVenueById = catchAsync(async (req: Request, res: Response) => {
    const venue = await AdminManagementService.getVenueById(req.params.venueId);

    return res.status(200).json({
      success: true,
      data: venue
    });
  });

  static getServiceById = catchAsync(async (req: Request, res: Response) => {
    const service = await AdminManagementService.getServiceById(req.params.serviceId);

    return res.status(200).json({
      success: true,
      data: service
    });
  });

  static approveVenue = catchAsync(async (req: Request, res: Response) => {
    const approver = getApprover(req);
    if (!approver) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: sign in before approving venues'
      });
    }

    const venue = await AdminManagementService.approveVenue(req.params.venueId, approver);
    return res.status(200).json({
      success: true,
      message: 'Venue approved successfully',
      data: venue
    });
  });

  static rejectVenue = catchAsync(async (req: Request, res: Response) => {
    const venue = await AdminManagementService.rejectVenue(req.params.venueId);
    return res.status(200).json({
      success: true,
      message: 'Venue rejected successfully',
      data: venue
    });
  });

  static approveService = catchAsync(async (req: Request, res: Response) => {
    const approver = getApprover(req);
    if (!approver) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: sign in before approving services'
      });
    }

    const service = await AdminManagementService.approveService(req.params.serviceId, approver);
    return res.status(200).json({
      success: true,
      message: 'Service approved successfully',
      data: service
    });
  });

  static rejectService = catchAsync(async (req: Request, res: Response) => {
    const service = await AdminManagementService.rejectService(req.params.serviceId);
    return res.status(200).json({
      success: true,
      message: 'Service rejected successfully',
      data: service
    });
  });
}
