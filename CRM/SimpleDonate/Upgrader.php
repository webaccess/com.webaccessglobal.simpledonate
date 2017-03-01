<?php

/**
 * Collection of upgrade steps
 */
class CRM_SimpleDonate_Upgrader extends CRM_SimpleDonate_Upgrader_Base {
  /**
   * Rebuild menu and caches.
   *
   * @return TRUE on success
   * @throws Exception
   *
   */
  public function upgrade_2001() {
    $this->ctx->log->info('Applying update 2001');
    //Make sure pages are stored in array format.
    $donationPage = CRM_Core_BAO_Setting::getItem('Simple Donation', 'simple_donation_page');
    $val = (array) $donationPage;
    CRM_Core_BAO_Setting::setItem($val, 'Simple Donation', 'simple_donation_page');

    CRM_Core_DAO::executeQuery("DELETE FROM civicrm_navigation WHERE name = 'Test Donation'");
    CRM_Core_DAO::executeQuery("DELETE FROM civicrm_navigation WHERE name = 'Live Donation'");
    $params = array(
      1 => array('Simple Donation Pages', 'String'),
      2 => array('civicrm/simple/donation/pages?reset=1', 'String'),
    );
    CRM_Core_DAO::executeQuery("UPDATE civicrm_navigation SET label = %1, name = %1, url = %2 WHERE name = 'Simple Donate'", $params);

    CRM_Core_Invoke::rebuildMenuAndCaches(TRUE);
    return TRUE;
  }

}
