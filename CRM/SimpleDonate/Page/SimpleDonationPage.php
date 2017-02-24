<?php
/*
 +--------------------------------------------------------------------+
 | CiviCRM version 4.7                                                |
 +--------------------------------------------------------------------+
 | Copyright CiviCRM LLC (c) 2004-2017                                |
 +--------------------------------------------------------------------+
 | This file is a part of CiviCRM.                                    |
 |                                                                    |
 | CiviCRM is free software; you can copy, modify, and distribute it  |
 | under the terms of the GNU Affero General Public License           |
 | Version 3, 19 November 2007 and the CiviCRM Licensing Exception.   |
 |                                                                    |
 | CiviCRM is distributed in the hope that it will be useful, but     |
 | WITHOUT ANY WARRANTY; without even the implied warranty of         |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.               |
 | See the GNU Affero General Public License for more details.        |
 |                                                                    |
 | You should have received a copy of the GNU Affero General Public   |
 | License and the CiviCRM Licensing Exception along                  |
 | with this program; if not, contact CiviCRM LLC                     |
 | at info[AT]civicrm[DOT]org. If you have questions about the        |
 | GNU Affero General Public License or the licensing of CiviCRM,     |
 | see the CiviCRM license FAQ at http://civicrm.org/licensing        |
 +--------------------------------------------------------------------+
 */

/**
 *
 * @package CRM
 * @copyright CiviCRM LLC (c) 2004-2017
 */

/**
 * Creates a page for displaying Simple Donate Contribute Pages
 *
 */
class CRM_SimpleDonate_Page_SimpleDonationPage extends CRM_Core_Page {

  /**
   * The action links that we need to display for the browse screen.
   *
   * @var array
   */
  private static $_actionLinks;

  /**
   * Run the page.
   */
  public function run() {
    // set breadcrumb to append to 2nd layer pages
    $breadCrumb = array(
      array(
        'title' => ts('Simple Donation Pages'),
        'url' => CRM_Utils_System::url(CRM_Utils_System::currentPath(),
          'reset=1'
        ),
      ),
    );
    $this->browse();

    CRM_Utils_System::setTitle(ts('Simple Donation Pages'));
    return parent::run();
  }

  /**
   * Browse all donation pages.
   */
  public function browse() {
    $settingVal = self::getSimpleDonateSetting();
    $donatePageIDs = implode(', ', $settingVal['donatePageID']);
    $whereClause = "id IN ({$donatePageIDs})";
    $query = "SELECT id, title
      FROM  civicrm_contribution_page
      WHERE  $whereClause
      ORDER BY is_active desc, title asc";
    $dao = CRM_Core_DAO::executeQuery($query, array(), TRUE, 'CRM_Contribute_DAO_ContributionPage');

    while ($dao->fetch()) {
      $contribution[$dao->id] = array();
      CRM_Core_DAO::storeValues($dao, $contribution[$dao->id]);

      // form all action links
      $action = array_sum(array_keys(self::actionLinks()));
      //build the normal action links.
      $contribution[$dao->id]['action'] = CRM_Core_Action::formLink(self::actionLinks(),
        $action,
        array('id' => $dao->id),
        ts('more'),
        FALSE,
        'contributionpage.action.links',
        'ContributionPage',
        $dao->id
      );
    }

    if (isset($contribution)) {
      $this->assign('rows', $contribution);
    }
  }

   /**
   * Get the action links for this page.
   *
   * @return array
   */
  public static function &actionLinks() {
    $urlString = 'civicrm/simple/donation/redirect';
    // check if variable _actionsLinks is populated
    if (!isset(self::$_actionLinks)) {
      self::$_actionLinks = array(
        CRM_Core_Action::PREVIEW => array(
          'name' => ts('Test Mode'),
          'title' => ts('Test Mode'),
          'url' => $urlString,
          'qs' => 'id=%%id%%&mode=test',
          'uniqueName' => 'test_mode',
        ),
        CRM_Core_Action::RENEW => array(
          'name' => ts('Live Mode'),
          'title' => ts('Live Mode'),
          'url' => $urlString,
          'qs' => 'id=%%id%%&mode=live',
          'fe' => TRUE,
          'uniqueName' => 'live_page',
        ),
      );
    }
    return self::$_actionLinks;
  }

  /**
   * get tab options from DB using setting-get api
   */
  public static function getSimpleDonateSetting() {
    $settingVal = array();
    $donateId = CRM_Core_BAO_Setting::getItem('Simple Donation', 'simple_donation_page');
    if (empty($donateId)) {
      //Redirect to configuration page if user has permission
      if (CRM_Core_Permission::check('administer CiviCRM')) {
        CRM_Core_Session::setStatus('Simple donation configuration is incomplete!', ts('Incomplete configuration'), 'warning');
        CRM_Utils_System::redirect(CRM_Utils_System::url('civicrm/simple/donation/configuration','reset=1'));
      }
      else {
        //CRM_Core_Error::debug_var('setting-get result for simple_donation_page', $settings);
        CRM_Core_Error::fatal(ts('Donation page is not configures. Please contact site administrator.'));
      }
    }
    else {
      $settingVal['donatePageID'] = $donateId;
      $settingVal['ziptasticEnable'] = CRM_Core_BAO_Setting::getItem('Simple Donation', 'ziptastic_enable');
    }
    return $settingVal;
  }

}
