<?php

/**
 * Collection of upgrade steps
 */
class CRM_SimpleDonate_Upgrader extends CRM_SimpleDonate_Upgrader_Base {
  /**
   * Example: Run a couple simple queries
   *
   * @return TRUE on success
   * @throws Exception
   *
   */
  public function upgrade_1201() {
    $this->ctx->log->info('Applying update 1201');
    CRM_Core_DAO::executeQuery("DELETE FROM civicrm_navigation WHERE name = 'Test Donation'");
    CRM_Core_DAO::executeQuery("DELETE FROM civicrm_navigation WHERE name = 'Live Donation'");
    $params = array(
      1 => array('Simple Donation Page', 'String'),
      2 => array('civicrm/simple/donation/pages?reset=1', 'String'),
    );
    CRM_Core_DAO::executeQuery("UPDATE civicrm_navigation SET label = %1, name = %1, url = %2 WHERE name = 'Simple Donate'", $params);
    return TRUE;
  }
}
